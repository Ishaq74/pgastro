# Real CMS Admin - Dashboard Mobile-First

Un système de gestion de contenu (CMS) admin dashboard ultra-responsive et mobile-first construit avec Astro et suivant une philosophie de design minimaliste "less is more".

## 🚀 Fonctionnalités

- **Mobile-First Design** : Interface optimisée pour tous les appareils
- **Ultra-Responsive** : Design adaptatif avec breakpoints intelligents
- **Design Minimal** : Interface épurée suivant la philosophie "less is more"
- **Système de Design Tokens** : Cohérence visuelle garantie
- **Navigation Intelligente** : Sidebar collapsible avec état persistant
- **Accessibilité** : Support complet des standards ARIA et navigation clavier
- **Base de Données** : Intégration PostgreSQL avec monitoring de statut

## 🎨 Charte Graphique

### Couleurs
- **Primaire** : #007BFF (bleu professionnel)
- **Neutre** : #6C757D (gris équilibré)
- **Arrière-plan** : #FFFFFF (blanc pur)
- **Succès** : #28A745
- **Attention** : #FFC107
- **Erreur** : #DC3545

### Typographie
- **Police Principale** : 'Inter', system-ui, sans-serif
- **Échelle** : 12px - 14px - 16px - 18px - 24px - 32px - 48px
- **Poids** : 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

### Espacement
- **Échelle 8px** : 4px - 8px - 16px - 24px - 32px - 48px - 64px - 96px

## 📱 Responsive Design

### Breakpoints
- **Mobile** : < 640px
- **Tablet** : 640px - 768px
- **Desktop** : > 768px

### Comportements Mobile
- Sidebar en overlay avec animation slide
- Menu hamburger touch-optimized (44px minimum)
- Navigation gestuelle fluide
- Tooltips adaptatifs

## 🛠️ Structure du Projet

```
src/
├── styles/
│   ├── tokens.css          # Design tokens (couleurs, spacing, typo)
│   └── global.css          # Styles globaux et utilitaires
├── layouts/
│   ├── Layout.astro        # Layout de base
│   └── AdminLayout.astro   # Layout admin avec sidebar
├── pages/
│   ├── index.astro         # Page d'accueil
│   └── admin.astro         # Dashboard principal
└── db.ts                   # Configuration base de données
```

## 🔧 Technologies

- **Astro 5.13.0** : Framework de rendu statique/hybride
- **TypeScript** : Typage statique
- **CSS Custom Properties** : Système de design tokens
- **PostgreSQL** : Base de données (via db.ts)

## 🚦 Démarrage Rapide

```bash
# Installation des dépendances
npm install

# Démarrage en développement
npm run dev

# Construction pour production
npm run build
```

## 📊 Dashboard

Le dashboard principal (`/admin`) affiche :

- **Cartes de vue d'ensemble** : Statistiques temps réel
- **Actions rapides** : Accès direct aux fonctions principales
- **Activité récente** : Historique des actions utilisateurs
- **Statut système** : Monitoring des performances et connectivité

## 🎯 Philosophie de Design

### Less is More
- Interface épurée sans éléments superflus
- Hiérarchie visuelle claire et logique
- Espacements généreux pour la respiration
- Couleurs limitées et cohérentes

### Mobile-First
- Conception prioritaire sur mobile
- Progressive enhancement vers desktop
- Touch targets optimisés (44px minimum)
- Navigation gestuelle intuitive

### Performance
- CSS optimisé avec custom properties
- JavaScript minimal et progressif
- Assets optimisés et lazy loading
- Transitions fluides sans impact performance

## � Authentification

(À implémenter selon besoins)

## 📈 Évolutions Futures

- [ ] Système d'authentification complet
- [ ] Gestion multi-tenant avancée
- [ ] Éditeur de contenu WYSIWYG
- [ ] Upload et gestion de médias
- [ ] API REST complète
- [ ] PWA (Progressive Web App)
- [ ] Mode sombre/clair
- [ ] Notifications push

---

**Développé avec ❤️ suivant les principes de design mobile-first et minimaliste**
