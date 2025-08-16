# 🔧 Initialisation de la Base de Données

Ce fichier contient les outils pour initialiser automatiquement la base de données Better Auth.

## 🚀 Utilisation

### Initialisation Automatique

La base de données est automatiquement initialisée lors du démarrage de l'application. Si l'initialisation automatique échoue, vous pouvez l'exécuter manuellement.

### Initialisation Manuelle

```bash
# Exécuter le script d'initialisation
npm run init-db
```

## 🎯 Fonctionnalités

- ✅ **Détection automatique** : Vérifie si les tables existent déjà
- 🔄 **Multi-base** : Support SQLite (dev) et PostgreSQL (prod)
- 🛡️ **Sécurisé** : Utilise `CREATE TABLE IF NOT EXISTS`
- 📊 **Optimisé** : Crée les index nécessaires pour les performances

## 🗄️ Tables Créées

### Table `user`
- Stockage des informations utilisateur
- Email unique et vérification d'email
- Horodatage création/modification

### Table `account`
- Gestion des comptes d'authentification
- Support multi-providers (email/password, OAuth, etc.)
- Tokens d'accès et de rafraîchissement

### Table `session`
- Sessions utilisateur sécurisées
- Gestion des expirations
- Tracking IP et User-Agent

### Table `verification`
- Tokens de vérification email
- Gestion des expirations
- Reset de mot de passe

## 🔧 Configuration

Le script utilise les variables d'environnement suivantes :

```env
# PostgreSQL (Production)
POSTGRES_HOST=your-postgres-host
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-password
POSTGRES_PORT=5432
POSTGRES_DB=pgastro

# Si non configuré, utilise SQLite en développement
```

## 🛠️ Développement

### Fichiers

- `src/database/init.ts` - Version TypeScript (avec types)
- `scripts/init-db.js` - Version JavaScript (exécutable)

### Extension

Pour ajouter des tables personnalisées, modifiez les constantes `BETTER_AUTH_TABLES_*` dans les fichiers d'initialisation.

## 📋 Dépannage

### Erreur : "Tables already exist"
✅ **Normal** - Les tables existent déjà, pas d'action nécessaire.

### Erreur : "Connection refused"
🔧 **Solution** - Vérifiez vos paramètres de base de données dans `.env`

### Erreur : "Permission denied"
🔑 **Solution** - Vérifiez les permissions de votre utilisateur de base de données

## 🔄 Réinitialisation

Pour réinitialiser complètement la base de données (⚠️ **DANGER - Perte de données**) :

```bash
# Supprimer le fichier SQLite (développement)
rm -f better-auth.db

# Puis réexécuter l'initialisation
npm run init-db
```

Pour PostgreSQL, connectez-vous manuellement et supprimez les tables si nécessaire.