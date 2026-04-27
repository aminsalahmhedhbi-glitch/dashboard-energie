# Production Persistence

## Ce que fait le backend

- Ne supprime jamais les tables au démarrage.
- Crée uniquement les tables manquantes.
- Ajoute les colonnes manquantes via une migration de compatibilité ciblée.
- Écrit un backup JSON automatique après chaque écriture critique :
  - `billing_records`
  - `pac_measurements`
  - `air_logs`
  - `site_histories`
  - `module_states`
  - `users`
  - `meetings`
  - `audits`
  - `actions`

## Emplacement des backups

- Par défaut : `data/backups`
- Si `APP_DATA_DIR` ou `RENDER_DISK_PATH` est défini :
  - `<APP_DATA_DIR>/backups`

## Commandes utiles

Créer un backup manuel :

```powershell
flask backup-data --reason manual
```

Restaurer le dernier backup :

```powershell
flask restore-data --snapshot latest.json
```

Restaurer un snapshot précis :

```powershell
flask restore-data --snapshot snapshot-YYYYMMDD-HHMMSS-manual.json
```

## Recommandation Render

Pour qu'un backup survive à un redeploy ou à un redémarrage complet :

- monter un disque persistant sur le service backend
- définir `APP_DATA_DIR` vers ce disque

Sans disque persistant, les backups restent utiles localement et dans l'instance courante, mais ne protègent pas contre la perte complète du filesystem du conteneur.
