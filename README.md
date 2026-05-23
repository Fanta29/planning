# 📅 Planning — Guide de déploiement pas-à-pas

Bienvenue ! Ce guide te permet de mettre ton app **Planning** en ligne et de l'installer sur ton iPhone, sans écrire une ligne de code. Compte **20-30 minutes** au total.

Tu vas faire 4 choses :
1. **Obtenir une clé Gemini** (gratuit, 3 min)
2. **Créer un compte GitHub** et y déposer le projet (10 min)
3. **Déployer sur Vercel** (5 min)
4. **Installer l'app sur ton iPhone** (2 min)

---

## ÉTAPE 1 — Obtenir une clé Gemini (gratuit)

1. Va sur **https://aistudio.google.com/app/apikey**
2. Connecte-toi avec ton compte Google (le même que ton Gmail/Drive habituel)
3. Clique sur le bouton bleu **« Create API key »**
4. Une longue chaîne de caractères apparaît (genre `AIzaSyD...xxxx`). C'est ta **clé API**.
5. **Copie-la** et garde-la quelque part en sécurité (Notes, message à toi-même, etc.). Tu vas la coller dans Vercel à l'étape 3.

> ⚠️ Cette clé est personnelle. Ne la partage avec personne et ne la mets jamais dans un message public.

---

## ÉTAPE 2 — Créer un compte GitHub et uploader le projet

### 2a. Créer un compte GitHub

1. Va sur **https://github.com/signup**
2. Suis les étapes (email, mot de passe, nom d'utilisateur). C'est gratuit.
3. Confirme ton email.

### 2b. Créer un nouveau « repository »

Un *repository* (souvent abrégé *repo*) est juste un dossier en ligne pour ton projet.

1. Une fois connecté, en haut à droite, clique sur **« + »** puis **« New repository »**
2. **Repository name** : tape `planning`
3. Laisse coché **« Public »** (ou choisis Private si tu préfères, ça marche aussi)
4. **NE COCHE PAS** « Add a README » ni les autres options
5. Clique sur **« Create repository »**

### 2c. Uploader les fichiers du projet

Sur la page du repository qui vient de s'ouvrir, tu vois un encadré avec plusieurs options. Tu cherches le lien **« uploading an existing file »** (au milieu de la phrase « You can quickly add a new file… or uploading an existing file »).

1. Clique sur **« uploading an existing file »**
2. **Décompresse le ZIP** que je t'ai fourni sur ton ordinateur. Tu obtiens un dossier `planning-app` contenant : `src/`, `public/`, `api/`, `package.json`, etc.
3. **Sélectionne TOUT le contenu** de ce dossier (PAS le dossier lui-même, mais ce qu'il y a dedans : les fichiers et les sous-dossiers `src`, `public`, `api`)
4. **Glisse-dépose** la sélection dans la zone de la page GitHub
5. Attends que tout finisse de s'uploader (la barre de progression doit disparaître)
6. En bas de la page, dans « Commit message », tape `première version`
7. Clique sur le bouton vert **« Commit changes »**

✅ Tes fichiers sont maintenant sur GitHub.

---

## ÉTAPE 3 — Déployer sur Vercel

### 3a. Créer un compte Vercel

1. Va sur **https://vercel.com/signup**
2. Clique sur **« Continue with GitHub »** (le plus simple — ça connecte directement les deux comptes)
3. Autorise Vercel à accéder à GitHub
4. Choisis le plan **Hobby** (gratuit, c'est ce qui s'affiche par défaut)

### 3b. Importer le projet

1. Une fois connecté, clique sur **« Add New… »** puis **« Project »**
2. Tu vois la liste de tes repositories GitHub. À côté de **`planning`**, clique sur **« Import »**
3. Une page de configuration s'affiche. **Ne touche à rien** sauf la section qui suit.

### 3c. Ajouter ta clé Gemini

C'est l'étape **cruciale**. Sur cette même page de configuration :

1. Cherche la section **« Environment Variables »** (déplie-la si elle est repliée)
2. Dans le champ **« Key »**, tape exactement : `GEMINI_API_KEY`
3. Dans le champ **« Value »**, colle la clé que tu as obtenue à l'étape 1 (`AIzaSy...`)
4. Clique sur **« Add »**

### 3d. Lancer le déploiement

1. Clique sur le gros bouton **« Deploy »**
2. Attends 1 à 2 minutes pendant que Vercel construit ton app
3. Quand un écran de félicitations apparaît avec des confettis 🎉, c'est gagné
4. Clique sur **« Continue to Dashboard »** (ou la prévisualisation de l'app)
5. **Note l'URL** de ton app : elle ressemble à `https://planning-xxxxx.vercel.app`

---

## ÉTAPE 4 — Installer l'app sur ton iPhone

1. Ouvre **Safari** sur ton iPhone (PAS Chrome, c'est important sur iOS)
2. Va sur l'URL Vercel de ton app
3. En bas de l'écran, appuie sur le bouton **Partager** (carré avec une flèche vers le haut)
4. Fais défiler les options et appuie sur **« Sur l'écran d'accueil »** (ou *Add to Home Screen* en anglais)
5. Tu peux modifier le nom si tu veux, puis appuie sur **« Ajouter »**

🎉 L'icône **Planning** est maintenant sur ton écran d'accueil, et l'app s'ouvre en plein écran comme une vraie app native.

---

## Comment modifier ton calendrier ensuite ?

À chaque fois que tu utilises l'app sur ton iPhone et que tu tapes une instruction dans la zone de texte en bas, elle est envoyée à Gemini, parsée, et le calendrier se met à jour. Tes données sont sauvegardées dans le navigateur de ton iPhone — elles ne disparaissent pas si tu fermes l'app.

Exemples de phrases qui marchent :
- `fac le 18/06 : GEAPT`
- `vacs du 1 au 6 juillet : Les Ardentes`
- `important : Finale LDC 30 mai`
- `le stage finit le 1er novembre`
- `Le Bris en vacances du 15 au 20 juillet`
- `enlève GEAPT`

---

## Et si je veux modifier le code (par exemple changer les médecins) ?

Pour l'instant les stages "Le Bris / Montalvo / Andro" sont codés en dur dans le fichier `src/App.jsx`, lignes 22-26. Si tu veux les changer plus tard, demande-moi : je te guide pour modifier directement sur GitHub (c'est facile) et Vercel redéployera automatiquement en 30 secondes.

---

## En cas de problème

- **L'app s'ouvre mais "Erreur" quand je tape une instruction** → tu as oublié la variable `GEMINI_API_KEY` dans Vercel, ou tu l'as mal collée. Va dans Vercel → ton projet → Settings → Environment Variables.
- **L'app ne s'ouvre pas du tout** → check l'onglet « Deployments » dans Vercel. Si tu vois une erreur rouge, envoie-moi la capture d'écran.
- **L'icône sur l'iPhone ne s'ouvre pas en plein écran** → tu as ajouté l'app depuis Chrome au lieu de Safari. Désinstalle-la et recommence avec Safari.
- **Autre** → screenshot et envoie-moi.

Bonne installation !
