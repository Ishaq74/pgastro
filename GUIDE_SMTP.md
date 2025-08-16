# 📧 Guide Complet du Système SMTP - Real CMS

## 🚀 **Vue d'Ensemble**

Le système SMTP de Real CMS est une solution complète et exhaustive pour la gestion des emails avec des messages d'erreur entièrement en français. Il offre une surveillance en temps réel, des tests approfondis et une gestion d'erreurs détaillée.

---

## 🔧 **Configuration SMTP**

### Variables d'Environnement (.env)

```bash
# Configuration SMTP Complète
SMTP_HOST=smtp.gmail.com                    # Serveur SMTP
SMTP_PORT=587                               # Port (587=TLS, 465=SSL, 25=Non-sécurisé)
SMTP_SECURE=false                           # true pour SSL, false pour TLS
SMTP_USER=votre-email@gmail.com             # Nom d'utilisateur/Email
SMTP_PASSWORD=votre-mot-de-passe-app        # Mot de passe (pour Gmail: mot de passe d'app)
SMTP_FROM=votre-email@gmail.com             # Email expéditeur par défaut
```

### Exemples de Configuration par Fournisseur

#### Gmail
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-email@gmail.com
SMTP_PASSWORD=mot-de-passe-application
```

#### Outlook/Hotmail
```bash
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-email@outlook.com
SMTP_PASSWORD=votre-mot-de-passe
```

#### Yahoo
```bash
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-email@yahoo.com
SMTP_PASSWORD=mot-de-passe-application
```

---

## 🎯 **Fonctionnalités Principales**

### 1. **Surveillance en Temps Réel**
- ✅ Indicateur de statut dans le header admin (📧 SMTP)
- ✅ Vérification automatique toutes les 30 secondes
- ✅ Codes couleur : Vert (connecté), Rouge (erreur), Orange (en cours)

### 2. **Interface de Test Complète**
- ✅ **Test Rapide** : Email prédéfini avec diagnostic complet
- ✅ **Email Personnalisé** : Sujet et message personnalisables
- ✅ **Validation Exhaustive** : Contrôle de tous les champs
- ✅ **Historique des Résultats** : Traçage de tous les envois

### 3. **Gestion d'Erreurs Avancée**
- ✅ Messages d'erreur détaillés en français
- ✅ Codes d'erreur spécifiques avec solutions
- ✅ Recommandations d'actions correctives
- ✅ Diagnostics approfondis

---

## 🔍 **Codes d'Erreur et Solutions**

### **CONFIG_INVALID** - Configuration Invalide
**Cause :** Variables SMTP manquantes ou incorrectes

**Solutions :**
1. Vérifiez le fichier .env
2. Contrôlez SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD
3. Redémarrez le serveur après modification

### **ENOTFOUND** - Serveur SMTP Introuvable
**Cause :** Nom d'hôte incorrect ou serveur inaccessible

**Solutions :**
1. Vérifiez l'adresse du serveur SMTP (SMTP_HOST)
2. Contrôlez votre connexion internet
3. Testez la résolution DNS

### **ECONNREFUSED** - Connexion Refusée
**Cause :** Port incorrect ou serveur qui refuse les connexions

**Solutions :**
1. Vérifiez le port SMTP (587 pour TLS, 465 pour SSL)
2. Contrôlez les paramètres de pare-feu
3. Assurez-vous que le serveur accepte les connexions

### **EAUTH** - Échec Authentification
**Cause :** Identifiants incorrects

**Solutions :**
1. Vérifiez SMTP_USER et SMTP_PASSWORD
2. Pour Gmail : utilisez un mot de passe d'application
3. Activez l'authentification à deux facteurs

### **ETIMEDOUT** - Délai Dépassé
**Cause :** Connexion trop lente ou bloquée

**Solutions :**
1. Vérifiez votre connexion internet
2. Contrôlez les paramètres de pare-feu
3. Testez avec un timeout plus long

---

## 📝 **Utilisation de l'Interface**

### Page SMTP (`/admin/smtp`)

#### Section Statut
- **Bouton Actualiser** : Force une nouvelle vérification
- **Diagnostics Détaillés** : Configuration, authentification, connectivité
- **Codes d'Erreur** : Avec explications et solutions

#### Section Test Rapide
1. Saisissez une adresse email destinataire
2. Cliquez sur "Envoyer test rapide"
3. Un email prédéfini avec diagnostics sera envoyé

#### Section Email Personnalisé
1. **Destinataire** : Adresse email valide (obligatoire)
2. **Sujet** : Maximum 200 caractères (obligatoire)
3. **Message** : Maximum 50 000 caractères (obligatoire)
4. Cliquez sur "Envoyer email"

#### Section Résultats
- **Historique Complet** : Tous les envois avec horodatage
- **Détails d'Erreur** : Messages détaillés et conseils
- **Types d'Alertes** : Succès, Erreur, Avertissement, Information

---

## 🔒 **Sécurité et Validation**

### Validation Côté Serveur
- ✅ Format email avec regex RFC compliant
- ✅ Longueur des champs (sujet, message)
- ✅ Sanitation des données d'entrée
- ✅ Protection contre l'injection

### Validation Côté Client
- ✅ Vérification en temps réel des champs
- ✅ Messages d'erreur immédiats
- ✅ Blocage des envois invalides
- ✅ Feedback visuel complet

---

## 🛠️ **Dépannage Avancé**

### Problèmes Courants

#### 1. **Gmail - "Less Secure Apps"**
**Solution :** Utilisez des mots de passe d'application :
1. Activez l'authentification à deux facteurs
2. Générez un mot de passe d'application
3. Utilisez ce mot de passe dans SMTP_PASSWORD

#### 2. **Pare-feu Bloque SMTP**
**Solution :** Autorisez les ports SMTP :
- Port 587 (TLS)
- Port 465 (SSL)
- Port 25 (Non-sécurisé, déconseillé)

#### 3. **Certificats SSL Invalides**
**Solution :** Dans smtp.ts, ajoutez :
```typescript
const smtpConfig = {
  // ... autres options
  tls: {
    rejectUnauthorized: false  // Pour développement uniquement
  }
};
```

---

## 📊 **Logs et Monitoring**

### Informations Trackées
- ✅ Tentatives de connexion
- ✅ Succès/échecs d'envoi
- ✅ Codes d'erreur détaillés
- ✅ Timestamps précis
- ✅ Configuration utilisée

### Accès aux Logs
1. Console du serveur Astro
2. Logs applicatifs (si configurés)
3. Interface admin (section Résultats)

---

## 🚀 **API Endpoints**

### `/api/smtp-status` (GET)
**Description :** Retourne le statut SMTP complet

**Réponse :**
```json
{
  "status": "connected|error",
  "success": true|false,
  "message": "Message principal",
  "detailedMessage": "Description détaillée",
  "errorCode": "CODE_ERREUR",
  "config": {
    "host": "smtp.gmail.com",
    "port": 587,
    "secure": false,
    "user": "user@gmail.com",
    "hasAuth": true
  },
  "diagnostics": {
    "hasConfiguration": true,
    "hasAuthentication": true,
    "connectionTested": true,
    "lastCheck": "15/08/2025 15:30:00"
  }
}
```

### `/api/send-email` (POST)
**Description :** Envoie un email (test ou personnalisé)

**Corps de Requête :**
```json
{
  "to": "destinataire@example.com",
  "subject": "Sujet de l'email",
  "message": "Contenu du message",
  "isTest": false,
  "from": "expediteur@example.com"
}
```

**Réponse :**
```json
{
  "success": true|false,
  "message": "Message principal",
  "detailedMessage": "Description détaillée",
  "errorCode": "CODE_ERREUR",
  "emailDetails": {
    "type": "test|custom",
    "recipient": "destinataire@example.com",
    "subject": "Sujet",
    "sentAt": "15/08/2025 15:30:00",
    "hasWarnings": false,
    "warnings": []
  }
}
```

---

## 📚 **Bonnes Pratiques**

### Configuration
1. **Toujours** utilisez des mots de passe d'application pour Gmail
2. **Préférez** TLS (port 587) à SSL (port 465)
3. **Testez** la configuration avant la mise en production
4. **Documentez** vos paramètres SMTP

### Sécurité
1. **Ne jamais** exposer les mots de passe SMTP
2. **Utilisez** des variables d'environnement
3. **Limitez** les adresses IP autorisées si possible
4. **Surveillez** les logs d'envoi

### Performance
1. **Réutilisez** les connexions SMTP
2. **Implémentez** des timeouts appropriés
3. **Gérez** les erreurs de façon gracieuse
4. **Monitorer** les performances d'envoi

---

## 🎉 **Conclusion**

Le système SMTP de Real CMS est maintenant **100% opérationnel** avec :

- ✅ **Messages d'erreur exhaustifs en français**
- ✅ **Validation complète et sécurisée**
- ✅ **Interface utilisateur intuitive**
- ✅ **Monitoring en temps réel**
- ✅ **Gestion d'erreurs avancée**
- ✅ **Documentation complète**

Votre CMS dispose maintenant d'un système d'envoi d'emails professionnel, robuste et entièrement localisé en français ! 🚀📧
