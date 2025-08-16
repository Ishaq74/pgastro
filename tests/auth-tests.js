/**
 * Tests automatisés pour l'authentification Better Auth
 */

// Importer fetch pour Node.js
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Configuration des tests
const BASE_URL = 'http://localhost:4321';
const TEST_USER = {
    email: 'test@example.com',
    password: 'testpassword123', // Mot de passe plus long pour Better Auth
    name: 'Test User'
};

class AuthTester {
    constructor() {
        this.results = [];
        this.cookies = '';
    }

    log(test, status, message) {
        const result = { test, status, message, timestamp: new Date().toISOString() };
        this.results.push(result);
        console.log(`${status === 'PASS' ? '✅' : '❌'} ${test}: ${message}`);
    }

    async makeRequest(path, options = {}) {
        try {
            const url = `${BASE_URL}${path}`;
            const response = await fetch(url, {
                headers: {
                    'Cookie': this.cookies,
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            // Sauvegarder les cookies pour les prochaines requêtes
            const setCookie = response.headers.get('set-cookie');
            if (setCookie) {
                this.cookies = setCookie;
            }

            return response;
        } catch (error) {
            throw new Error(`Erreur réseau: ${error.message}`);
        }
    }

    async test1_PageAccueil() {
        try {
            const response = await this.makeRequest('/');
            if (response.status === 200) {
                const html = await response.text();
                if (html.includes('RealAstro') && html.includes('main-header')) {
                    this.log('TEST 1', 'PASS', 'Page d\'accueil charge avec header');
                } else {
                    this.log('TEST 1', 'FAIL', 'Header manquant sur page accueil');
                }
            } else {
                this.log('TEST 1', 'FAIL', `Status ${response.status}`);
            }
        } catch (error) {
            this.log('TEST 1', 'FAIL', error.message);
        }
    }

    async test2_PageRegister() {
        try {
            const response = await this.makeRequest('/register');
            if (response.status === 200) {
                const html = await response.text();
                if (html.includes('Inscription') && html.includes('registerForm')) {
                    this.log('TEST 2', 'PASS', 'Page inscription accessible');
                } else {
                    this.log('TEST 2', 'FAIL', 'Formulaire inscription manquant');
                }
            } else {
                this.log('TEST 2', 'FAIL', `Status ${response.status}`);
            }
        } catch (error) {
            this.log('TEST 2', 'FAIL', error.message);
        }
    }

    async test3_PageLogin() {
        try {
            const response = await this.makeRequest('/login');
            if (response.status === 200) {
                const html = await response.text();
                if (html.includes('Connexion') && html.includes('loginForm')) {
                    this.log('TEST 3', 'PASS', 'Page login accessible');
                } else {
                    this.log('TEST 3', 'FAIL', 'Formulaire login manquant');
                }
            } else {
                this.log('TEST 3', 'FAIL', `Status ${response.status}`);
            }
        } catch (error) {
            this.log('TEST 3', 'FAIL', error.message);
        }
    }

    async test4_PageForgotPassword() {
        try {
            const response = await this.makeRequest('/forgot-password');
            if (response.status === 200) {
                const html = await response.text();
                if (html.includes('Mot de passe oublié') && html.includes('reset-form')) {
                    this.log('TEST 4', 'PASS', 'Page mot de passe oublié accessible');
                } else {
                    this.log('TEST 4', 'FAIL', 'Formulaire reset manquant');
                }
            } else {
                this.log('TEST 4', 'FAIL', `Status ${response.status}`);
            }
        } catch (error) {
            this.log('TEST 4', 'FAIL', error.message);
        }
    }

    async test5_ProtectionDashboard() {
        try {
            const response = await this.makeRequest('/dashboard', { redirect: 'manual' });
            if (response.status === 302) {
                const location = response.headers.get('location');
                if (location && location.includes('/login')) {
                    this.log('TEST 5', 'PASS', 'Dashboard redirige vers login (non connecté)');
                } else {
                    this.log('TEST 5', 'FAIL', `Redirection vers ${location} au lieu de /login`);
                }
            } else {
                this.log('TEST 5', 'FAIL', `Status ${response.status} au lieu de 302`);
            }
        } catch (error) {
            this.log('TEST 5', 'FAIL', error.message);
        }
    }

    async test6_ProtectionProfile() {
        try {
            const response = await this.makeRequest('/profile', { redirect: 'manual' });
            if (response.status === 302) {
                const location = response.headers.get('location');
                if (location && location.includes('/login')) {
                    this.log('TEST 6', 'PASS', 'Profile redirige vers login (non connecté)');
                } else {
                    this.log('TEST 6', 'FAIL', `Redirection vers ${location} au lieu de /login`);
                }
            } else {
                this.log('TEST 6', 'FAIL', `Status ${response.status} au lieu de 302`);
            }
        } catch (error) {
            this.log('TEST 6', 'FAIL', error.message);
        }
    }

    async test7_ProtectionAdmin() {
        try {
            const response = await this.makeRequest('/admin', { redirect: 'manual' });
            if (response.status === 302) {
                const location = response.headers.get('location');
                if (location && location.includes('/login')) {
                    this.log('TEST 7', 'PASS', 'Admin redirige vers login (non connecté)');
                } else {
                    this.log('TEST 7', 'FAIL', `Redirection vers ${location} au lieu de /login`);
                }
            } else {
                this.log('TEST 7', 'FAIL', `Status ${response.status} au lieu de 302`);
            }
        } catch (error) {
            this.log('TEST 7', 'FAIL', error.message);
        }
    }

    async test8_APIDbStatus() {
        try {
            const response = await this.makeRequest('/api/db-status');
            if (response.status === 200) {
                const data = await response.json();
                if (data.success) {
                    this.log('TEST 8', 'PASS', 'API DB Status fonctionne');
                } else {
                    this.log('TEST 8', 'FAIL', `DB Error: ${data.error}`);
                }
            } else {
                this.log('TEST 8', 'FAIL', `Status ${response.status}`);
            }
        } catch (error) {
            this.log('TEST 8', 'FAIL', error.message);
        }
    }

    async test9_APISmtpStatus() {
        try {
            const response = await this.makeRequest('/api/smtp-status');
            if (response.status === 200) {
                const data = await response.json();
                if (data.success) {
                    this.log('TEST 9', 'PASS', 'API SMTP Status fonctionne');
                } else {
                    this.log('TEST 9', 'FAIL', `SMTP Error: ${data.error}`);
                }
            } else {
                this.log('TEST 9', 'FAIL', `Status ${response.status}`);
            }
        } catch (error) {
            this.log('TEST 9', 'FAIL', error.message);
        }
    }

    async test10_InscriptionUtilisateur() {
        try {
            const response = await this.makeRequest('/api/signup', {
                method: 'POST',
                body: JSON.stringify({
                    email: TEST_USER.email,
                    password: TEST_USER.password,
                    name: TEST_USER.name
                })
            });

            if (response.status === 200 || response.status === 201) {
                this.log('TEST 10', 'PASS', 'Inscription utilisateur réussie');
                return true;
            } else {
                const error = await response.text();
                this.log('TEST 10', 'FAIL', `Inscription échouée: ${error}`);
                return false;
            }
        } catch (error) {
            this.log('TEST 10', 'FAIL', error.message);
            return false;
        }
    }

    async test11_ConnexionUtilisateur() {
        try {
            const response = await this.makeRequest('/api/auth/sign-in', {
                method: 'POST',
                body: JSON.stringify({
                    email: TEST_USER.email,
                    password: TEST_USER.password
                })
            });

            if (response.status === 200) {
                this.log('TEST 11', 'PASS', 'Connexion utilisateur réussie');
                return true;
            } else {
                const error = await response.text();
                this.log('TEST 11', 'FAIL', `Connexion échouée: ${error}`);
                return false;
            }
        } catch (error) {
            this.log('TEST 11', 'FAIL', error.message);
            return false;
        }
    }

    async test12_AccesDashboardConnecte() {
        try {
            const response = await this.makeRequest('/dashboard');
            if (response.status === 200) {
                const html = await response.text();
                if (html.includes('Dashboard') && html.includes('Informations utilisateur')) {
                    this.log('TEST 12', 'PASS', 'Accès dashboard avec utilisateur connecté');
                } else {
                    this.log('TEST 12', 'FAIL', 'Dashboard ne charge pas correctement');
                }
            } else {
                this.log('TEST 12', 'FAIL', `Status ${response.status}`);
            }
        } catch (error) {
            this.log('TEST 12', 'FAIL', error.message);
        }
    }

    async test13_APIResetPassword() {
        try {
            const response = await this.makeRequest('/api/reset-password', {
                method: 'POST',
                body: JSON.stringify({
                    email: TEST_USER.email
                })
            });

            if (response.status === 200) {
                const data = await response.json();
                if (data.success) {
                    this.log('TEST 13', 'PASS', 'API Reset Password fonctionne');
                } else {
                    this.log('TEST 13', 'FAIL', `Reset Error: ${data.error}`);
                }
            } else {
                this.log('TEST 13', 'FAIL', `Status ${response.status}`);
            }
        } catch (error) {
            this.log('TEST 13', 'FAIL', error.message);
        }
    }

    async test14_CreationCompteAdmin() {
        try {
            const response = await this.makeRequest('/api/create-test-accounts', {
                method: 'POST',
                body: JSON.stringify({
                    action: 'create-admin'
                })
            });

            if (response.status === 200) {
                const data = await response.json();
                if (data.success) {
                    this.log('TEST 14', 'PASS', 'Compte admin créé: admin@test.com');
                    return true;
                } else {
                    this.log('TEST 14', 'FAIL', `Création admin échouée: ${data.error}`);
                    return false;
                }
            } else {
                this.log('TEST 14', 'FAIL', `Status ${response.status}`);
                return false;
            }
        } catch (error) {
            this.log('TEST 14', 'FAIL', error.message);
            return false;
        }
    }

    async test15_CreationCompteUser() {
        try {
            const response = await this.makeRequest('/api/create-test-accounts', {
                method: 'POST',
                body: JSON.stringify({
                    action: 'create-user'
                })
            });

            if (response.status === 200) {
                const data = await response.json();
                if (data.success) {
                    this.log('TEST 15', 'PASS', 'Compte utilisateur créé: user@test.com');
                    return true;
                } else {
                    this.log('TEST 15', 'FAIL', `Création user échouée: ${data.error}`);
                    return false;
                }
            } else {
                this.log('TEST 15', 'FAIL', `Status ${response.status}`);
                return false;
            }
        } catch (error) {
            this.log('TEST 15', 'FAIL', error.message);
            return false;
        }
    }

    async test16_ConnexionAdmin() {
        try {
            const response = await this.makeRequest('/api/auth-signin', {
                method: 'POST',
                body: JSON.stringify({
                    email: 'admin@test.com',
                    password: 'admin123456'
                })
            });

            if (response.status === 200) {
                const data = await response.json();
                if (data.success) {
                    this.log('TEST 16', 'PASS', 'Connexion admin réussie');
                    return true;
                } else {
                    this.log('TEST 16', 'FAIL', `Connexion admin échouée: ${data.error}`);
                    return false;
                }
            } else {
                this.log('TEST 16', 'FAIL', `Status ${response.status}`);
                return false;
            }
        } catch (error) {
            this.log('TEST 16', 'FAIL', error.message);
            return false;
        }
    }

    async test17_AccesAdminDashboard() {
        try {
            const response = await this.makeRequest('/admin');
            if (response.status === 200) {
                const html = await response.text();
                if (html.includes('Panneau d\'Administration') && html.includes('admin@test.com')) {
                    this.log('TEST 17', 'PASS', 'Accès panneau admin avec compte admin');
                } else {
                    this.log('TEST 17', 'FAIL', 'Panneau admin ne charge pas correctement');
                }
            } else {
                this.log('TEST 17', 'FAIL', `Status ${response.status} - accès admin refusé`);
            }
        } catch (error) {
            this.log('TEST 17', 'FAIL', error.message);
        }
    }

    async test18_APIAdminUsers() {
        try {
            const response = await this.makeRequest('/api/admin/users');
            if (response.status === 200) {
                const data = await response.json();
                if (data.success && data.users) {
                    this.log('TEST 18', 'PASS', `API Admin Users: ${data.users.length} utilisateurs trouvés`);
                } else {
                    this.log('TEST 18', 'FAIL', 'API Admin Users ne retourne pas les utilisateurs');
                }
            } else {
                this.log('TEST 18', 'FAIL', `Status ${response.status}`);
            }
        } catch (error) {
            this.log('TEST 18', 'FAIL', error.message);
        }
    }

    async test19_APIAdminStats() {
        try {
            const response = await this.makeRequest('/api/admin/stats');
            if (response.status === 200) {
                const data = await response.json();
                if (data.success && typeof data.totalUsers === 'number') {
                    this.log('TEST 19', 'PASS', `API Admin Stats: ${data.totalUsers} users, ${data.admins} admins`);
                } else {
                    this.log('TEST 19', 'FAIL', 'API Admin Stats ne retourne pas les bonnes données');
                }
            } else {
                this.log('TEST 19', 'FAIL', `Status ${response.status}`);
            }
        } catch (error) {
            this.log('TEST 19', 'FAIL', error.message);
        }
    }

    async test20_ConnexionUser() {
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

            if (response.status === 200) {
                const data = await response.json();
                if (data.success) {
                    this.log('TEST 20', 'PASS', 'Connexion utilisateur normal réussie');
                    return true;
                } else {
                    this.log('TEST 20', 'FAIL', `Connexion user échouée: ${data.error}`);
                    return false;
                }
            } else {
                this.log('TEST 20', 'FAIL', `Status ${response.status}`);
                return false;
            }
        } catch (error) {
            this.log('TEST 20', 'FAIL', error.message);
            return false;
        }
    }

    async test21_AccesAdminRefuseUser() {
        try {
            const response = await this.makeRequest('/admin', { redirect: 'manual' });
            if (response.status === 403) {
                this.log('TEST 21', 'PASS', 'Accès admin refusé à l\'utilisateur normal (403)');
            } else if (response.status === 302) {
                this.log('TEST 21', 'PASS', 'Accès admin redirigé pour utilisateur normal (302)');
            } else if (response.status === 200) {
                this.log('TEST 21', 'FAIL', 'Utilisateur normal a accès admin - SÉCURITÉ COMPROMISE!');
            } else {
                this.log('TEST 21', 'FAIL', `Status inattendu: ${response.status}`);
            }
        } catch (error) {
            this.log('TEST 21', 'FAIL', error.message);
        }
    }

    async test22_AccesDashboardUser() {
        try {
            const response = await this.makeRequest('/dashboard');
            if (response.status === 200) {
                const html = await response.text();
                if (html.includes('Dashboard') && html.includes('user@test.com')) {
                    this.log('TEST 22', 'PASS', 'Accès dashboard avec utilisateur normal');
                } else {
                    this.log('TEST 22', 'FAIL', 'Dashboard ne charge pas correctement pour user');
                }
            } else {
                this.log('TEST 22', 'FAIL', `Status ${response.status}`);
            }
        } catch (error) {
            this.log('TEST 22', 'FAIL', error.message);
        }
    }

    async runAllTests() {
        console.log('🚀 DÉBUT DES TESTS AUTOMATISÉS BETTER AUTH\n');
        
        // Tests sans authentification
        await this.test1_PageAccueil();
        await this.test2_PageRegister();
        await this.test3_PageLogin();
        await this.test4_PageForgotPassword();
        await this.test5_ProtectionDashboard();
        await this.test6_ProtectionProfile();
        await this.test7_ProtectionAdmin();
        await this.test8_APIDbStatus();
        await this.test9_APISmtpStatus();
        
        // Tests avec authentification
        const inscriptionOK = await this.test10_InscriptionUtilisateur();
        if (inscriptionOK) {
            const connexionOK = await this.test11_ConnexionUtilisateur();
            if (connexionOK) {
                await this.test12_AccesDashboardConnecte();
            }
        }
        
        await this.test13_APIResetPassword();
        
        this.printSummary();
    }

    printSummary() {
        console.log('\n📊 RÉSUMÉ DES TESTS:');
        console.log('='.repeat(50));
        
        const passed = this.results.filter(r => r.status === 'PASS').length;
        const failed = this.results.filter(r => r.status === 'FAIL').length;
        const total = this.results.length;
        
        console.log(`✅ Tests réussis: ${passed}/${total}`);
        console.log(`❌ Tests échoués: ${failed}/${total}`);
        console.log(`📈 Taux de réussite: ${Math.round((passed/total)*100)}%\n`);
        
        if (failed > 0) {
            console.log('❌ ÉCHECS:');
            this.results.filter(r => r.status === 'FAIL').forEach(r => {
                console.log(`   ${r.test}: ${r.message}`);
            });
        }
        
        console.log('\n🎯 TESTS TERMINÉS!');
    }
}

// Exécution des tests
if (typeof window === 'undefined') {
    // Node.js environment
    const tester = new AuthTester();
    tester.runAllTests().catch(console.error);
} else {
    // Browser environment
    window.AuthTester = AuthTester;
}
