# Cahier de Recette - Application "Les Petits Pas" 🧸🏆

Ce document regroupe le protocole d'essais et les scénarios de test (cahier de recette fonctionnelle) de l'application **Les Petits Pas**, une solution de gestion de crèche connectant les parents et l'équipe d'encadrement en temps réel.

---

## 📅 Métadonnées du Document
* **Projet :** Les Petits Pas
* **Version de l'application :** 1.0.0
* **Date de recette :** 14 juillet 2026
* **Statut de la recette :** En cours (Recette d'intégration V1.0)
* **Auteur / Responsable :** Responsable QA / Équipe Produit

---

## 🛠️ 1. Environnement de Recette & Prérequis

### Stack Technique sous-jacente
L'application s'appuie sur la stack technique suivante :
* **Framework :** Next.js 16 (App Router, Server Actions)
* **Base de données / Authentification :** Supabase (PostgreSQL, Supabase Auth & RLS)
* **Notifications :** API Resend (Envoi de mails automatiques aux encadrants lors d'un nouveau message)
* **Interface Utilisateur :** Tailwind CSS, Composants ShadCN

### Profils et Comptes de Test Requis
Pour exécuter l'ensemble de la recette, les comptes de tests suivants sont préconfigurés dans la base de données :

| Identifiant | Rôle | Enfants associés | Remarques |
| :--- | :--- | :--- | :--- |
| `parent@lespetitspas.fr` | Parent | `59163d44-b1fa-4e93-bfed-ae443557763d` (Théo) | Enfant pour lequel l'autorisation de traitement médical est activée. |
| `parent_sans_auth@lespetitspas.fr` | Parent | `88a234ca-1b2c-47e9-aab1` (Julie) | Enfant pour lequel l'autorisation médicale est désactivée. |
| `responsable@lespetitspas.fr` | Staff (Éducateur) | N/A (Voit tous les enfants) | Droits de consultation générale et de saisie d'activités. |

---

## 📊 2. Structure Standard d'une Fiche de Test

Chaque test du cahier de recette doit être rédigé selon le gabarit d'en-tête suivant :

```markdown
### [CODE_MODULE-###] : Titre du Cas de Test

| Propriété | Description |
| :--- | :--- |
| **Module** | [Nom du module concerné, ex: Authentification, Espace Parent, etc.] |
| **Description** | [Objectif du test précis et portée de la vérification] |
| **Acteur(s)** | [Rôle utilisateur requis pour exécuter le test] |
| **Prérequis** | [État initial nécessaire de l'application et de la base de données] |

#### Procédure d'exécution & Résultats
| Étape | Actions à mener | Résultats attendus | Statut |
| :--- | :--- | :--- | :--- |
| **1** | [Action physique ou clic utilisateur] | [Comportement du système observable] | [OK / KO / Bloquant] |
| **2** | [Saisie de données / Soumission] | [Changement d'état visible, redirection, message] | [OK / KO] |

**Notes / Commentaires complémentaires :**
[Toute observation ou détail technique, ex: logs console, fallbacks]
```

---

## 📑 3. Liste des Scénarios de Recette (Squelette & En-têtes)

Voici la table des matières des différents tests préconisés pour valider l'application :

* **Module 1 : Authentification & Cycle de Session (AUTH)**
  * `AUTH-101` : Connexion nominale (Rôle Parent)
  * `AUTH-102` : Connexion nominale (Rôle Staff)
  * `AUTH-103` : Rejet de connexion (Identifiants erronés ou inexistants)
  * `AUTH-104` : Déconnexion et destruction de session
  * `AUTH-105` : Redirection automatique des routes protégées (Middleware)

* **Module 2 : Espace Parent - Consultation & Interactions (PRNT)**
  * `PRNT-201` : Consultation générale et journalière de la timeline d'un enfant
  * `PRNT-210` : Création et émission d'un nouveau message au personnel
  * `PRNT-220` : Suggestion du "Rituel du Livre du Soir" - Comportement API nominal
  * `PRNT-221` : Suggestion du "Rituel du Livre du Soir" - Gestion d'erreur & Fallback

* **Module 3 : Espace Staff - Gestion du Quotidien (STFF)**
  * `STFF-301` : Consultation du dashboard (Grille des enfants par section)
  * `STFF-311` : Saisie d'un repas (Mots d'évaluation : Tout mangé, Moyen, etc.)
  * `STFF-312` : Saisie d'une sieste (Format d'heures de début / fin)
  * `STFF-313` : Saisie d'un incident de santé / sécurité (Rapport de gravité)
  * `STFF-320` : Administration de médicament - Enfant AVEC autorisation médicale
  * `STFF-321` : Administration de médicament - Enfant SANS autorisation médicale (403 bloquant)
  * `STFF-330` : Lecture et transition d'état d'un message parent (Lu ➔ Traité)

---

## 🧪 4. Exemples de Scénarios Complétés

Afin de guider l'équipe de développement et de recette, voici deux exemples de tests intégralement complétés et validés.

---

### 📖 PRNT-221 : Suggestion du "Rituel du Livre du Soir" (Cas dégradé - Mode Fallback)

| Propriété | Description |
| :--- | :--- |
| **Module** | Espace Parent - Timeline de l'enfant (Rituel du Livre du Soir) |
| **Description** | Vérifier que l'application bascule correctement sur sa liste locale de 5 classiques intemporels si l'API Open Library est indisponible ou hors-délai (Timeout de 5000ms), avec un affichage visuellement impeccable et le badge "Classique suggéré" affiché. |
| **Acteur(s)** | Parent |
| **Prérequis** | L'utilisateur est connecté en tant que Parent. Accès autonome à la timeline de son enfant. Une simulation de panne réseau est provoquée (soit en coupant la connexion Wi-Fi, soit en altérant temporairement l'URL de l'API dans le code en `https://openlibrary_fake_error.org/`). |

#### Procédure d'exécution & Résultats
| Étape | Actions à mener | Résultats attendus | Statut |
| :--- | :--- | :--- | :--- |
| **1** | Couper la connexion réseau ou forcer une URL invalide pour Open Library. Se connecter sur l'espace parent (ex: `/parent`). | La page se charge. L'utilisateur clique sur la fiche de son enfant dans le dashboard parent pour se rendre sur la timeline `/parent/children/[id]`. | **OK** |
| **2** | Faire défiler l'écran complètement vers le bas de la timeline quotidienne pour localiser le bandeau du **Rituel de l'histoire du soir**. | Le bloc s'affiche de manière instantanée (sans block d'attente prolongé de plus de 5s grâce à l'échéance de l'`AbortController`). Un livre classique parmi notre sélection de secours s'affiche (ex: *Chien Bleu* par Nadja). | **OK** |
| **3** | Contrôler la présence d'indicateurs visuels spécifiques de rechange. | Le badge orange doré arborant la mention **"Classique suggéré"** est bien visible. L'illustration de couverture du livre (si l'image n'est pas récupérable hors-ligne) est remplacée de manière élégante par une maquette de couverture en CSS stylisé avec la charte graphique **Soleil** beige cannelle (`#EFDFC5`). | **OK** |
| **4** | Cliquer à trois reprises sur le bouton **"Voir une autre idée"**. | Le classique fait l'objet d'un cycle fluide et aléatoire, proposant d'autres ouvrages de secours (ex: *La chenille qui fait des trous* ou *Le Petit Prince*) sans aucun plantage de la vue. | **OK** |

**Notes / Commentaires complémentaires :**
* Le mécanisme de contournement (fallback) est ultra robuste. L'`AbortController` configuré à `5000ms` garantit que l'expérience utilisateur reste optimale même sur réseau de type 3G bridé.
* **Testeur :** Émile Z.
* **Résultat Final :** **PASS (Conforme)**

---

### 💊 STFF-321 : Administration de médicament (Cas d'exclusion - Enfant sans autorisation)

| Propriété | Description |
| :--- | :--- |
| **Module** | Espace Staff - Gestion du Quotidien (Événement Médicament) |
| **Description** | S'assurer que le système bloque côté serveur et côté client toute tentative d'enregistrement à la volée d'une administration médicamenteuse pour un enfant dont les parents ont explicitement refusé l'autorisation médicale de médication. |
| **Acteur(s)** | Staff (Éducateur ou Directeur de crèche) |
| **Prérequis** | Être connecté avec un compte d'encadrant (`responsable@lespetitspas.fr`). La fiche de l'enfant Julie (`88a234ca-1b2c-47e9-aab1`) possède la valeur de base de données `medication_authorization = FALSE`. |

#### Procédure d'exécution & Résultats
| Étape | Actions à mener | Résultats attendus | Statut |
| :--- | :--- | :--- | :--- |
| **1** | Se rendre sur le portail d'accueil Staff `/staff` et cliquer sur la carte de la petite "Julie". | Redirection vers la page de détails et de gestion de l'enfant`/staff/children/88a234ca-1b2c-47e9-aab1`. | **OK** |
| **2** | Inspecter l'interface d'ajout d'événements et cliquer sur l'onglet **"Médicament"**. | L'interface affiche une icône d'interdiction ou un bandeau d'alerte rouge explicitant : *« Administration non autorisée par la famille »*. Le formulaire de saisie est désactivé (champs grisés et bouton d'action principal inactif). | **OK** |
| **3** | *(Test d'intrusion technique/sécurité)* Tenter de contourner l'interface utilisateur en émettant directement un appel serveur bypass via la Server Action `createEventAction()` avec les données : `child_id: "88a234ca-1b2c-47e9-aab1"`, `event_type: "medicament"`, `medication_name: "Doliprane 150mg"`. | Le serveur intercepte l'appel, procède à une analyse en base de données de la colonne `medication_authorization` et renvoie immédiatement l'erreur structurée : `success: false, error: "403: Administration de médicament non autorisée pour cet enfant."` sans persister la moindre ligne dans la table `events`. | **OK** |

**Notes / Commentaires complémentaires :**
* La sécurité s'applique à deux niveaux distincts : côté UI (ShadCN alert et bouton disabled) et de manière hermétique côté Server Action (`createEventAction()`).
* **Testeur :** Sarah B.
* **Résultat Final :** **PASS (Conforme - Sécurité rigoureuse)**
