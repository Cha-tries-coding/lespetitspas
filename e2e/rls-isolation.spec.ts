import { test, expect } from '@playwright/test';

const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Password123';

test.describe('Module Isolation des Données (RLS)', () => {

  test('Isolation parent-enfant : consultation restreinte aux seuls enfants autorisés', async ({ browser }) => {
    // -------------------------------------------------------------------------
    // Phase 1 : Découverte dynamique de l'ID d'Ilyès via la session Staff
    // -------------------------------------------------------------------------
    const staffContext = await browser.newContext();
    const staffPage = await staffContext.newPage();

    // Connexion en tant que Staff
    await staffPage.goto('/login');
    await staffPage.getByLabel('Adresse e-mail').fill('cha.capel+staff@gmail.com');
    await staffPage.getByLabel('Mot de passe').fill(TEST_PASSWORD);
    await staffPage.getByRole('button', { name: 'Se connecter' }).click();
    await expect(staffPage).toHaveURL(/\/staff/);

    // Recherche de la carte d'Ilyès dans l'espace staff pour en extraire l'UUID
    // La liste de tous les enfants contient la carte de "Ilyès"
    const ilyesCardLink = staffPage.locator('a').filter({ hasText: /Ilyès|Ilyes/i }).first();
    await expect(ilyesCardLink).toBeVisible();
    
    const ilyesHref = await ilyesCardLink.getAttribute('href');
    if (!ilyesHref) {
      throw new Error("Impossible de localiser l'ID d'Ilyès dans l'espace staff.");
    }
    
    // Récupération de l'UUID à la fin du chemin d'accès /staff/children/[id]
    const ilyesId = ilyesHref.split('/').pop();
    await staffContext.close(); // Fermeture de la session de découverte

    // -------------------------------------------------------------------------
    // Phase 2 : Connexion en tant que Parent 1 & vérification de la visibilité
    // -------------------------------------------------------------------------
    const parentContext = await browser.newContext();
    const parentPage = await parentContext.newPage();

    // Connexion en tant que parent1
    await parentPage.goto('/login');
    await parentPage.getByLabel('Adresse e-mail').fill('cha.capel+parent1@gmail.com');
    await parentPage.getByLabel('Mot de passe').fill(TEST_PASSWORD);
    await parentPage.getByRole('button', { name: 'Se connecter' }).click();
    await expect(parentPage).toHaveURL(/\/parent/);

    // Vérifier que le parent1 ne voit que ses enfants (Ana Maria et Sarah), et pas Ilyès
    await expect(parentPage.getByText('Ana Maria')).toBeVisible();
    await expect(parentPage.getByText('Sarah')).toBeVisible();
    
    // Le nom d'Ilyès doit être complètement absent de l'écran d'accueil du Parent 1
    await expect(parentPage.getByText('Ilyès')).not.toBeVisible();
    await expect(parentPage.getByText('Ilyes')).not.toBeVisible();

    // -------------------------------------------------------------------------
    // Phase 3 : Tentative d'intrusion (accès direct par URL à l'enfant d'un tiers)
    // -------------------------------------------------------------------------
    // Tentative d'accès forcé sur /parent/children/[id_ilyes]
    await parentPage.goto(`/parent/children/${ilyesId}`);

    // Ce comportement anormal doit déclencher une redirection vers /parent (RLS Check Server-Side)
    await expect(parentPage).toHaveURL(/\/parent/);

    await parentContext.close();
  });

});
