# Fonctionnalité Bonus : Rituel du Livre du Soir 📖 ✨

Cette fonctionnalité a été ajoutée sur la timeline de l'espace parent afin de prolonger la journée de l'enfant par un moment privilégié d'échanges et de calme en famille. Elle suggère chaque soir un album de littérature jeunesse recommandé.

---

## 🛠️ Détails d'implémentation

### 1. Intégration de l'API Open Library
La recommandation d'album interroge l'API publique Open Library sans clé d'API via l'URL suivante :
`https://openlibrary.org/search.json?q=album+jeunesse&limit=5`

Le composant affiche par défaut le premier projet retourné, et permet au parent de cycler parmi les 5 suggestions chargées en cliquant sur le bouton **"Voir une autre idée"**.

### 2. Gestion robuste des cas limites (Edge Cases)
Pour s'assurer d'une expérience fluide et d'un fonctionnement ininterrompu, plusieurs cas de défaillance ont été anticipés et sécurisés pas à pas :

- ⏳ **Timeout de l'API (Réseau lent) :**
  Un `AbortController` minuté à `5 secondes (5000ms)` force l'abandon de la requête si l'API Open Library met trop de temps à répondre (réseau mobile dégradé, surcharge d'Open Library). L'application bascule alors instantanément sur notre liste locale de classiques.
  
- 📭 **0 résultat renvoyé ou erreur HTTP :**
  Si l'API renvoie une liste vide ou retourne une erreur (statut non optimal), l'erreur est interceptée proprement pour déclencher le plan de secours local.
  
- 🧸 **Liste de secours locale (Fallback de secours) :**
  En cas de panne de l'API ou de timeout, nous recommandons une sélection soignée parmi les 5 plus grands classiques intemporels de la littérature enfantine, intégrés de manière statique :
  - *La chenille qui fait des trous* par Eric Carle
  - *Devine combien je t'aime* par Sam McBratney
  - *Chien Bleu* par Nadja
  - *Max et les Maximonstres* par Maurice Sendak
  - *Le Petit Prince* par Antoine de Saint-Exupéry
  
- 🖼️ **Couverture absente ou défaillante :**
  Si le livre ne possède pas d'identifiant de couverture (`cover_i`) ou si l'API de rendu d'image de couverture (`https://covers.openlibrary.org/b/id/{id}-M.jpg`) échoue à s'afficher (erreur 404 gérée via `onError` sur la balise d'image), le livre n'affiche pas une image brisée. L'application génère dynamiquement une couverture en pur CSS de grande qualité dans la charte graphique **Soleil** arborant un dégradé, le logo de l'application, l'icône du livre, le titre et l'auteur.

---

## 🎨 Design Visuel (Charte Soleil)
L'intégration est 100% conforme à l'identité visuelle **Les Petits Pas** :
- **Arrière-plan :** Dégradé chaleureux du Crème de soleil (`from-[#FFFBF0] to-[#FFFDF5]`) avec une fine bordure en cannelle beige doux (`#EFDFC5`).
- **Accentuation supérieure :** Une bordure supérieure multicolore aux couleurs phares de la crèche (Corail `#FF8A65` → Or `#FFD54F` → Émeraude `#66BB6A`).
- **Badges et Boutons :** Utilisation des composants ShadCN (`Card`, `Badge`, `SoleilButton`), incluant un badge lumineux orné d'un logo à étincelle animée : `Sparkles`.

---

## 🧪 Protocole de Test

### Test 1 : Vérification nominale (Comportement normal)
1. Connectez-vous en tant que parent ou accédez à la timeline d'un enfant sur `/parent/children/[votre_id_enfant]`.
2. Faites défiler la page tout en bas de la timeline quotidienne.
3. Vérifiez la présence du bloc **"Rituel de l'histoire du soir"** qui affiche un livre issu d'Open Library.
4. Cliquez sur le bouton **"Voir une autre idée"** de manière répétée pour voir le livre se modifier de façon fluide.

### Test 2 : Couverture manquante (Simulée)
*Si un des résultats d'Open Library n'a pas de couverture disponible, observez le rendu graphique élégant généré à la volée avec l'icône de livre et un dégradé orangé.*

### Test 3 : Erreur de l'API ou Timeout (Simulé)
Pour observer le système de secours local en action :
1. Ouvrez l'inspecteur web et simulez un passage **hors-connexion (Offline)** dans l'onglet Réseau (Network), ou rendez-vous dans le fichier [app/parent/children/[id]/child-timeline-client.tsx](app/parent/children/[id]/child-timeline-client.tsx) et altérez l'URL du `fetch` (ex: `https://openlibrary_fake_error.org/`).
2. Observez que le bloc se charge instantanément malgré l'absence de réseau ou après 5 secondes, en proposant l'un de nos classiques et en arborant le badge **"Classique suggéré"**.
