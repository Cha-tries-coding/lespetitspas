import { test, expect } from '@playwright/test';

// Mot de passe par défaut pour nos tests (modifiable via variable d'environnement)
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Password123';

test.describe('Module Authentification & Session (AUTH)', () => {

  test('Connexion Staff nominale redirigée vers /staff', async ({ page }) => {
    // Étape 1 : Aller sur la page de connexion
    // Playwright utilise baseURL: "http://localhost:3000", donc page.goto('/login') fonctionne
    await page.goto('/login');

    // Étape 2 : Saisir l'adresse e-mail de l'encadrant (Staff)
    await page.getByLabel('Adresse e-mail').fill('cha.capel+staff@gmail.com');

    // Étape 3 : Saisir le mot de passe
    await page.getByLabel('Mot de passe').fill(TEST_PASSWORD);

    // Étape 4 : Cliquer sur le bouton de connexion
    await page.getByRole('button', { name: 'Se connecter' }).click();

    // Étape 5 : S'assurer de la redirection vers l'espace staff
    await expect(page).toHaveURL(/\/staff/);
    
    // Détection d'un élément clé spécifique à l'espace staff pour confirmer le chargement complet de la vue
    await expect(page.getByRole('heading', { name: 'Les enfants' })).toBeVisible();
  });

  test('Connexion Parent nominale redirigée vers /parent', async ({ page }) => {
    // Étape 1 : Aller sur la page de connexion
    await page.goto('/login');

    // Étape 2 : Saisir l'adresse e-mail du parent de test
    await page.getByLabel('Adresse e-mail').fill('cha.capel+parent1@gmail.com');

    // Étape 3 : Saisir le mot de passe
    await page.getByLabel('Mot de passe').fill(TEST_PASSWORD);

    // Étape 4 : Cliquer sur le bouton de connexion
    await page.getByRole('button', { name: 'Se connecter' }).click();

    // Étape 5 : S'assurer de la redirection vers l'espace parent
    await expect(page).toHaveURL(/\/parent/);
    
    // Détection d'un élément clé de l'espace parent pour confirmer l'affichage
    await expect(page.getByRole('heading', { name: 'Espace famille' })).toBeVisible();
  });

  test('Rejet de connexion en cas de mauvais mot de passe', async ({ page }) => {
    // Étape 1 : Aller sur la page de connexion
    await page.goto('/login');

    // Étape 2 : Saisir l'adresse e-mail
    await page.getByLabel('Adresse e-mail').fill('cha.capel+parent1@gmail.com');

    // Étape 3 : Saisir un mot de passe manifestement erroné
    await page.getByLabel('Mot de passe').fill('WrongPassword123');

    // Étape 4 : Cliquer sur le bouton de connexion
    await page.getByRole('button', { name: 'Se connecter' }).click();

    // Étape 5 : S'assurer de l'affichage du message d'erreur
    const errorAlert = page.locator('div[role="alert"]');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText(/Connexion refusée/);
    await expect(errorAlert).toContainText(/Adresse e-mail ou mot de passe incorrect/);

    // S'assurer qu'aucune redirection n'a eu lieu et que l'utilisateur est toujours sur /login
    await expect(page).toHaveURL(/\/login/);
  });

});
