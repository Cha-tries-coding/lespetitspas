import { test, expect } from '@playwright/test';

const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Password123';

test.describe('Module Espace Staff - Protection Médication (STFF-MED)', () => {

  test('La saisie d\'un médicament est bloquée si l\'enfant n\'a pas d\'autorisation médicale', async ({ page }) => {
    // -------------------------------------------------------------------------
    // Étape 1 : Connexion en tant que Staff
    // -------------------------------------------------------------------------
    await page.goto('/login');
    await page.getByLabel('Adresse e-mail').fill('cha.capel+staff@gmail.com');
    await page.getByLabel('Mot de passe').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Se connecter' }).click();
    await expect(page).toHaveURL(/\/staff/);

    // -------------------------------------------------------------------------
    // Étape 2 : Découverte dynamique d'un enfant qui n'a pas d'autorisation
    // -------------------------------------------------------------------------
    // Récupérer tous les liens menant à une fiche enfant
    const childLinks = await page.locator('a[href*="/staff/children/"]').all();
    let childFound = false;

    for (let i = 0; i < childLinks.length; i++) {
      // Re-sélectionner les cartes à chaque boucle pour éviter le détachement DOM (Stale Element)
      const currentLinks = await page.locator('a[href*="/staff/children/"]').all();
      await currentLinks[i].click();
      await page.waitForLoadState('domcontentloaded');

      // Identifier si la mention "Non autorisé" de la section médication est présente à l'écran
      const isUnauthorized = await page.getByText('Non autorisé').isVisible();
      if (isUnauthorized) {
        childFound = true;
        break; // Candidat trouvé, on conserve cette page
      }

      // Revenir à l'accueil pour tester le suivant
      await page.goto('/staff');
      await page.waitForLoadState('domcontentloaded');
    }

    if (!childFound) {
      throw new Error("Aucun enfant avec 'autorisation médicaments = Non' n'a été repéré dans la base.");
    }

    // -------------------------------------------------------------------------
    // Étape 3 : Tentative d'ajout d'une administration de médicament
    // -------------------------------------------------------------------------
    // Cliquer sur le bouton ShadCN "Ajouter un événement"
    await page.getByRole('button', { name: 'Ajouter un événement' }).click();

    // Cliquer sur l'onglet d'événement "Médicament"
    await page.getByRole('button', { name: 'Médicament' }).click();

    // -------------------------------------------------------------------------
    // Étape 4 : Validations de sécurité
    // -------------------------------------------------------------------------
    // Vérifier la présence du bandeau d'avertissement
    await expect(page.getByText("Attention : L'administration de médicaments n'est pas autorisée pour cet enfant.")).toBeVisible();
    
    // Vérifier la présence de la notice rouge d'interdiction d'enregistrement
    await expect(page.getByText("Enregistrement impossible : L'administration de médicaments n'est pas autorisée par les parents.")).toBeVisible();

    // Vérifier que le champ de saisie du médicament est désactivé (disabled=true)
    await expect(page.getByPlaceholder("ex: Doliprane 150mg...")).toBeDisabled();

    // Vérifier que la case à cocher de confirmation d'autorisation parentale est également désactivée
    await expect(page.locator('#medicationConfirmed')).toBeDisabled();

    // Vérifier enfin que le bouton de soumission "Enregistrer" est de type désactivé
    await expect(page.getByRole('button', { name: 'Enregistrer' })).toBeDisabled();
  });

});
