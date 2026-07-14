import { test, expect } from '@playwright/test';

const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Password123';

test.describe('Module Messagerie Parents-Encadrants (MSGS)', () => {

  test('Envoi de message pour Ana Maria (Parent) et réception "Nouveau" sur l\'espace Staff', async ({ browser }) => {
    const uniqueId = Date.now();
    const uniqueMessageContent = `Bonjour l'équipe, consigne de test d'intégration [ID: ${uniqueId}]. Merci !`;

    // -------------------------------------------------------------------------
    // Phase 1 : Émission du message par le parent configuré
    // -------------------------------------------------------------------------
    const parentContext = await browser.newContext();
    const parentPage = await parentContext.newPage();

    // Connexion en tant que Parent
    await parentPage.goto('/login');
    await parentPage.getByLabel('Adresse e-mail').fill('cha.capel+parent1@gmail.com');
    await parentPage.getByLabel('Mot de passe').fill(TEST_PASSWORD);
    await parentPage.getByRole('button', { name: 'Se connecter' }).click();
    await expect(parentPage).toHaveURL(/\/parent/);

    // Redirection vers l'interface de création d'un message
    await parentPage.goto('/parent/messages/new');

    // Sélectionner l'enfant "Ana Maria" dans le champ déroulant d'options (id="child_select")
    const selectChild = parentPage.locator('#child_select');
    // On cible de manière robuste l'option contenant "Ana Maria" par son texte
    const optionValue = await parentPage.locator('#child_select option', { hasText: 'Ana Maria' }).getAttribute('value');
    if (optionValue) {
      await selectChild.selectOption(optionValue);
    } else {
      await selectChild.selectOption({ index: 0 });
    }

    // Saisir le message unique
    await parentPage.locator('#message_content').fill(uniqueMessageContent);

    // Valider la transmission
    await parentPage.getByRole('button', { name: 'Transmettre le message' }).click();

    // Contrôler l'apparition du bloc de succès ShadCN / Tailwind
    await expect(parentPage.getByText("Votre message a été transmis avec succès à l'équipe !")).toBeVisible();

    // Fermer l'environnement parent pour isoler les sessions
    await parentContext.close();

    // -------------------------------------------------------------------------
    // Phase 2 : Vérification du message et contrôle de son état dans l'espace Staff
    // -------------------------------------------------------------------------
    const staffContext = await browser.newContext();
    const staffPage = await staffContext.newPage();

    // Connexion en tant qu'encadrant (Staff)
    await staffPage.goto('/login');
    await staffPage.getByLabel('Adresse e-mail').fill('cha.capel+staff@gmail.com');
    await staffPage.getByLabel('Mot de passe').fill(TEST_PASSWORD);
    await staffPage.getByRole('button', { name: 'Se connecter' }).click();
    await expect(staffPage).toHaveURL(/\/staff/);

    // Consultation de la boîte de messagerie
    await staffPage.goto('/staff/messages');

    // Retrouver la carte ou la cellule de message contenant notre texte d'ID unique
    const postedMessageCard = staffPage.locator('div').filter({ hasText: uniqueMessageContent }).first();
    await expect(postedMessageCard).toBeVisible();

    // S'assurer que le badge d'état non lu "Nouveau" est bien affiché de manière visible
    const newBadge = postedMessageCard.getByText('Nouveau');
    await expect(newBadge).toBeVisible();

    await staffContext.close();
  });

});
