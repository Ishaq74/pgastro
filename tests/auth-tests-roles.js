import http from 'http';
import https from 'https';
import { URL } from 'url';

class AuthTester {
    constructor() {
        this.baseUrl = 'http://localhost:4321';
        this.cookies = '';
        this.results = [];
    }

    log(testNumber, status, message) {
        const timestamp = new Date().toLocaleTimeString();
        const emoji = status === 'PASS' ? '✅' : '❌';
        console.log(`[${timestamp}] ${emoji} ${testNumber}: ${message}`);
        this.results.push({ test: testNumber, status, message });
    }

    async makeRequest(path, options = {}) {
        return new Promise((resolve, reject) => {
            const url = new URL(path, this.baseUrl);
            const isHttps = url.protocol === 'https:';
            const lib = isHttps ? https : http;
            
            const requestOptions = {
                hostname: url.hostname,
                port: url.port || (isHttps ? 443 : 80),
                path: url.pathname + url.search,
                method: options.method || 'GET',
                headers: {
                    'User-Agent': 'AuthTester/1.0',
                    'Accept': 'text/html,application/json,*/*',
                    ...options.headers
                },
                ...options
            };

            if (this.cookies) {
                requestOptions.headers['Cookie'] = this.cookies;
            }

            if (options.body) {
                requestOptions.headers['Content-Type'] = 'application/json';
                requestOptions.headers['Content-Length'] = Buffer.byteLength(options.body);
            }

            const req = lib.request(requestOptions, (res) => {
                if (res.headers['set-cookie']) {
                    this.cookies = res.headers['set-cookie'].join('; ');
                }
                resolve(res);
            });

            req.on('error', reject);
            req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            if (options.body) {
                req.write(options.body);
            }
            req.end();
        });
    }

    // ============ TESTS DE BASE ============

    async test1_ServeurActif() {
        try {
            const response = await this.makeRequest('/');
            if (response.statusCode === 200) {
                this.log('TEST 1', 'PASS', 'Serveur actif sur localhost:4321');
                return true;
            } else {
                this.log('TEST 1', 'FAIL', `Status ${response.statusCode}`);
                return false;
            }
        } catch (error) {
            this.log('TEST 1', 'FAIL', error.message);
            return false;
        }
    }

    async test2_PageLogin() {
        try {
            const response = await this.makeRequest('/login');
            if (response.statusCode === 200) {
                this.log('TEST 2', 'PASS', 'Page login accessible');
                return true;
            } else {
                this.log('TEST 2', 'FAIL', `Status ${response.statusCode}`);
                return false;
            }
        } catch (error) {
            this.log('TEST 2', 'FAIL', error.message);
            return false;
        }
    }

    async test3_PageRegister() {
        try {
            const response = await this.makeRequest('/register');
            if (response.statusCode === 200) {
                this.log('TEST 3', 'PASS', 'Page register accessible');
                return true;
            } else {
                this.log('TEST 3', 'FAIL', `Status ${response.statusCode}`);
                return false;
            }
        } catch (error) {
            this.log('TEST 3', 'FAIL', error.message);
            return false;
        }
    }

    async test4_EtatDB() {
        try {
            const response = await this.makeRequest('/api/db-status');
            if (response.statusCode === 200) {
                this.log('TEST 4', 'PASS', 'Base de données connectée');
                return true;
            } else {
                this.log('TEST 4', 'FAIL', `Status ${response.statusCode}`);
                return false;
            }
        } catch (error) {
            this.log('TEST 4', 'FAIL', error.message);
            return false;
        }
    }

    async test5_EtatSMTP() {
        try {
            const response = await this.makeRequest('/api/smtp-status');
            if (response.statusCode === 200) {
                this.log('TEST 5', 'PASS', 'SMTP configuré');
                return true;
            } else {
                this.log('TEST 5', 'FAIL', `Status ${response.statusCode}`);
                return false;
            }
        } catch (error) {
            this.log('TEST 5', 'FAIL', error.message);
            return false;
        }
    }

    async test6_RouteAuth() {
        try {
            const response = await this.makeRequest('/api/auth/session');
            if (response.statusCode === 200 || response.statusCode === 401) {
                this.log('TEST 6', 'PASS', 'Routes Better Auth actives');
                return true;
            } else {
                this.log('TEST 6', 'FAIL', `Status ${response.statusCode}`);
                return false;
            }
        } catch (error) {
            this.log('TEST 6', 'FAIL', error.message);
            return false;
        }
    }

    // ============ TESTS D'INSCRIPTION ============

    async test7_InscriptionUtilisateur() {
        try {
            // Utiliser l'endpoint Better Auth directement
            const betterAuthBody = new URLSearchParams({
                email: 'test@example.com',
                password: 'test123456',
                name: 'Test User'
            });

            const response = await this.makeRequest('/api/auth/sign-up/email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: betterAuthBody.toString()
            });

            if (response.statusCode === 200 || response.statusCode === 302) {
                this.log('TEST 7', 'PASS', 'Inscription utilisateur réussie');
                return true;
            } else if (response.statusCode === 422) {
                // Utilisateur existe déjà
                this.log('TEST 7', 'PASS', 'Utilisateur existe déjà (Normal)');
                return true;
            } else {
                this.log('TEST 7', 'FAIL', `Status ${response.statusCode}`);
                return false;
            }
        } catch (error) {
            this.log('TEST 7', 'FAIL', error.message);
            return false;
        }
    }

    async test8_ConnexionUtilisateur() {
        try {
            // Utiliser l'endpoint Better Auth directement
            const betterAuthBody = new URLSearchParams({
                email: 'test@example.com',
                password: 'test123456'
            });

            const response = await this.makeRequest('/api/auth/sign-in/email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: betterAuthBody.toString()
            });

            if (response.statusCode === 200 || response.statusCode === 302) {
                this.log('TEST 8', 'PASS', 'Connexion utilisateur réussie');
                return true;
            } else {
                this.log('TEST 8', 'FAIL', `Status ${response.statusCode}`);
                return false;
            }
        } catch (error) {
            this.log('TEST 8', 'FAIL', error.message);
            return false;
        }
    }

    async test9_AccesDashboard() {
        try {
            const response = await this.makeRequest('/dashboard');
            if (response.statusCode === 200) {
                this.log('TEST 9', 'PASS', 'Accès dashboard avec session');
                return true;
            } else {
                this.log('TEST 9', 'FAIL', `Status ${response.statusCode}`);
                return false;
            }
        } catch (error) {
            this.log('TEST 9', 'FAIL', error.message);
            return false;
        }
    }

    async test10_Deconnexion() {
        try {
            const response = await this.makeRequest('/api/auth/sign-out', {
                method: 'POST'
            });
            
            if (response.statusCode === 200 || response.statusCode === 302) {
                this.log('TEST 10', 'PASS', 'Déconnexion réussie');
                this.cookies = ''; // Reset cookies
                return true;
            } else {
                this.log('TEST 10', 'FAIL', `Status ${response.statusCode}`);
                return false;
            }
        } catch (error) {
            this.log('TEST 10', 'FAIL', error.message);
            return false;
        }
    }

    async test11_AccesProtege() {
        try {
            const response = await this.makeRequest('/dashboard');
            if (response.statusCode === 302 || response.statusCode === 401) {
                this.log('TEST 11', 'PASS', 'Accès dashboard protégé après déconnexion');
                return true;
            } else {
                this.log('TEST 11', 'FAIL', `Status ${response.statusCode} - accès non protégé!`);
                return false;
            }
        } catch (error) {
            this.log('TEST 11', 'FAIL', error.message);
            return false;
        }
    }

    // ============ TESTS AVEC RÔLES ============

    async test12_CreationCompteAdmin() {
        try {
            const response = await this.makeRequest('/api/create-test-accounts', {
                method: 'POST',
                body: JSON.stringify({
                    action: 'create-admin'
                })
            });

            if (response.statusCode === 200) {
                const chunks = [];
                for await (const chunk of response) {
                    chunks.push(chunk);
                }
                const data = JSON.parse(Buffer.concat(chunks).toString());
                
                if (data.success) {
                    this.log('TEST 12', 'PASS', 'Compte admin créé: admin@test.com');
                    return true;
                } else {
                    this.log('TEST 12', 'FAIL', `Création admin échouée: ${data.error}`);
                    return false;
                }
            } else {
                this.log('TEST 12', 'FAIL', `Status ${response.statusCode}`);
                return false;
            }
        } catch (error) {
            this.log('TEST 12', 'FAIL', error.message);
            return false;
        }
    }

    async test13_CreationCompteUser() {
        try {
            const response = await this.makeRequest('/api/create-test-accounts', {
                method: 'POST',
                body: JSON.stringify({
                    action: 'create-user'
                })
            });

            if (response.statusCode === 200) {
                const chunks = [];
                for await (const chunk of response) {
                    chunks.push(chunk);
                }
                const data = JSON.parse(Buffer.concat(chunks).toString());
                
                if (data.success) {
                    this.log('TEST 13', 'PASS', 'Compte utilisateur créé: user@test.com');
                    return true;
                } else {
                    this.log('TEST 13', 'FAIL', `Création user échouée: ${data.error}`);
                    return false;
                }
            } else {
                this.log('TEST 13', 'FAIL', `Status ${response.statusCode}`);
                return false;
            }
        } catch (error) {
            this.log('TEST 13', 'FAIL', error.message);
            return false;
        }
    }

    async test14_ConnexionAdmin() {
        try {
            const response = await this.makeRequest('/api/auth-signin', {
                method: 'POST',
                body: JSON.stringify({
                    email: 'admin@test.com',
                    password: 'admin123456'
                })
            });

            if (response.statusCode === 200) {
                const chunks = [];
                for await (const chunk of response) {
                    chunks.push(chunk);
                }
                const data = JSON.parse(Buffer.concat(chunks).toString());
                
                if (data.success) {
                    this.log('TEST 14', 'PASS', 'Connexion admin réussie');
                    return true;
                } else {
                    this.log('TEST 14', 'FAIL', `Connexion admin échouée: ${data.error}`);
                    return false;
                }
            } else {
                this.log('TEST 14', 'FAIL', `Status ${response.statusCode}`);
                return false;
            }
        } catch (error) {
            this.log('TEST 14', 'FAIL', error.message);
            return false;
        }
    }

    async test15_AccesAdminDashboard() {
        try {
            const response = await this.makeRequest('/admin');
            if (response.statusCode === 200) {
                this.log('TEST 15', 'PASS', 'Accès panneau admin avec compte admin');
                return true;
            } else {
                this.log('TEST 15', 'FAIL', `Status ${response.statusCode} - accès admin refusé`);
                return false;
            }
        } catch (error) {
            this.log('TEST 15', 'FAIL', error.message);
            return false;
        }
    }

    async test16_APIAdminUsers() {
        try {
            const response = await this.makeRequest('/api/admin/users');
            if (response.statusCode === 200) {
                const chunks = [];
                for await (const chunk of response) {
                    chunks.push(chunk);
                }
                const data = JSON.parse(Buffer.concat(chunks).toString());
                
                if (data.success && data.users) {
                    this.log('TEST 16', 'PASS', `API Admin Users: ${data.users.length} utilisateurs trouvés`);
                    return true;
                } else {
                    this.log('TEST 16', 'FAIL', 'API Admin Users ne retourne pas les utilisateurs');
                    return false;
                }
            } else {
                this.log('TEST 16', 'FAIL', `Status ${response.statusCode}`);
                return false;
            }
        } catch (error) {
            this.log('TEST 16', 'FAIL', error.message);
            return false;
        }
    }

    async test17_APIAdminStats() {
        try {
            const response = await this.makeRequest('/api/admin/stats');
            if (response.statusCode === 200) {
                const chunks = [];
                for await (const chunk of response) {
                    chunks.push(chunk);
                }
                const data = JSON.parse(Buffer.concat(chunks).toString());
                
                if (data.success && typeof data.totalUsers === 'number') {
                    this.log('TEST 17', 'PASS', `API Admin Stats: ${data.totalUsers} users, ${data.admins} admins`);
                    return true;
                } else {
                    this.log('TEST 17', 'FAIL', 'API Admin Stats ne retourne pas les bonnes données');
                    return false;
                }
            } else {
                this.log('TEST 17', 'FAIL', `Status ${response.statusCode}`);
                return false;
            }
        } catch (error) {
            this.log('TEST 17', 'FAIL', error.message);
            return false;
        }
    }

    async test18_ConnexionUser() {
        // Se déconnecter d'abord (reset cookies)
        this.cookies = '';
        
        try {
            const response = await this.makeRequest('/api/auth-signin', {
                method: 'POST',
                body: JSON.stringify({
                    email: 'user@test.com',
                    password: 'user123456'
                })
            });

            if (response.statusCode === 200) {
                const chunks = [];
                for await (const chunk of response) {
                    chunks.push(chunk);
                }
                const data = JSON.parse(Buffer.concat(chunks).toString());
                
                if (data.success) {
                    this.log('TEST 18', 'PASS', 'Connexion utilisateur normal réussie');
                    return true;
                } else {
                    this.log('TEST 18', 'FAIL', `Connexion user échouée: ${data.error}`);
                    return false;
                }
            } else {
                this.log('TEST 18', 'FAIL', `Status ${response.statusCode}`);
                return false;
            }
        } catch (error) {
            this.log('TEST 18', 'FAIL', error.message);
            return false;
        }
    }

    async test19_AccesAdminRefuseUser() {
        try {
            const response = await this.makeRequest('/admin');
            if (response.statusCode === 403) {
                this.log('TEST 19', 'PASS', 'Accès admin refusé à l\'utilisateur normal (403)');
                return true;
            } else if (response.statusCode === 302) {
                this.log('TEST 19', 'PASS', 'Accès admin redirigé pour utilisateur normal (302)');
                return true;
            } else if (response.statusCode === 200) {
                this.log('TEST 19', 'FAIL', 'Utilisateur normal a accès admin - SÉCURITÉ COMPROMISE!');
                return false;
            } else {
                this.log('TEST 19', 'FAIL', `Status inattendu: ${response.statusCode}`);
                return false;
            }
        } catch (error) {
            this.log('TEST 19', 'FAIL', error.message);
            return false;
        }
    }

    async test20_AccesDashboardUser() {
        try {
            const response = await this.makeRequest('/dashboard');
            if (response.statusCode === 200) {
                this.log('TEST 20', 'PASS', 'Accès dashboard avec utilisateur normal');
                return true;
            } else {
                this.log('TEST 20', 'FAIL', `Status ${response.statusCode}`);
                return false;
            }
        } catch (error) {
            this.log('TEST 20', 'FAIL', error.message);
            return false;
        }
    }

    async test21_ProfileUser() {
        try {
            const response = await this.makeRequest('/profile');
            if (response.statusCode === 200) {
                this.log('TEST 21', 'PASS', 'Accès profile avec utilisateur normal');
                return true;
            } else {
                this.log('TEST 21', 'FAIL', `Status ${response.statusCode}`);
                return false;
            }
        } catch (error) {
            this.log('TEST 21', 'FAIL', error.message);
            return false;
        }
    }

    async test22_VerificationRoles() {
        try {
            const response = await this.makeRequest('/api/auth/session');
            if (response.statusCode === 200) {
                const chunks = [];
                for await (const chunk of response) {
                    chunks.push(chunk);
                }
                const data = JSON.parse(Buffer.concat(chunks).toString());
                
                if (data && data.user && data.user.role) {
                    this.log('TEST 22', 'PASS', `Rôle utilisateur détecté: ${data.user.role}`);
                    return true;
                } else {
                    this.log('TEST 22', 'FAIL', 'Rôle utilisateur non détecté dans session');
                    return false;
                }
            } else {
                this.log('TEST 22', 'FAIL', `Status ${response.statusCode}`);
                return false;
            }
        } catch (error) {
            this.log('TEST 22', 'FAIL', error.message);
            return false;
        }
    }

    // ============ MÉTHODE PRINCIPALE ============

    async runAllTests() {
        console.log('🚀 TESTS COMPLETS BETTER AUTH AVEC RÔLES\n');
        
        let results = [];
        
        // Tests de base
        console.log('📋 Tests de base...\n');
        results.push(await this.test1_ServeurActif());
        results.push(await this.test2_PageLogin());
        results.push(await this.test3_PageRegister());
        results.push(await this.test4_EtatDB());
        results.push(await this.test5_EtatSMTP());
        results.push(await this.test6_RouteAuth());
        
        // Tests d'authentification basique
        console.log('\n🔐 Tests d\'authentification...\n');
        results.push(await this.test7_InscriptionUtilisateur());
        results.push(await this.test8_ConnexionUtilisateur());
        results.push(await this.test9_AccesDashboard());
        results.push(await this.test10_Deconnexion());
        results.push(await this.test11_AccesProtege());
        
        // Tests avec rôles admin/client
        console.log('\n🎭 Tests des rôles admin/client...\n');
        results.push(await this.test12_CreationCompteAdmin());
        results.push(await this.test13_CreationCompteUser());
        results.push(await this.test14_ConnexionAdmin());
        results.push(await this.test15_AccesAdminDashboard());
        results.push(await this.test16_APIAdminUsers());
        results.push(await this.test17_APIAdminStats());
        results.push(await this.test18_ConnexionUser());
        results.push(await this.test19_AccesAdminRefuseUser());
        results.push(await this.test20_AccesDashboardUser());
        results.push(await this.test21_ProfileUser());
        results.push(await this.test22_VerificationRoles());
        
        // Statistiques finales
        const passed = results.filter(r => r === true).length;
        const total = results.length;
        const percentage = Math.round((passed / total) * 100);
        
        console.log(`\n${'='.repeat(70)}`);
        console.log(`✅ RÉSULTATS FINAUX: ${passed}/${total} tests réussis (${percentage}%)`);
        console.log(`${'='.repeat(70)}\n`);
        
        if (percentage === 100) {
            console.log('🎉 TOUS LES TESTS SONT PASSÉS! Auth avec rôles parfaitement fonctionnel!');
        } else if (percentage >= 90) {
            console.log('🔥 EXCELLENT! Quasi tous les tests passent!');
        } else if (percentage >= 75) {
            console.log('✨ BIEN! La plupart des tests passent!');
        } else {
            console.log('⚠️  Certains tests ont échoué. Vérifiez les détails ci-dessus.');
        }
        
        return { passed, total, percentage };
    }
}

// Exécution des tests
const tester = new AuthTester();
tester.runAllTests().catch(console.error);
