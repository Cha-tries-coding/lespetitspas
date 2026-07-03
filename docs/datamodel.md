erDiagram
    profiles {
        uuid id PK
        user_role role
        text full_name
        text email
        timestamptz created_at
    }
    children {
        uuid id PK
        text first_name
        text last_name
        text section
        text allergies
        boolean medication_authorization
        text photo_url
        timestamptz created_at
        uuid created_by FK
    }
    family_members {
        uuid id PK
        uuid child_id FK
        uuid profile_id FK
        timestamptz created_at
    }
    events {
        uuid id PK
        uuid child_id FK
        event_type event_type
        text note
        text meal_quality
        timestamptz start_time
        timestamptz end_time
        text activity_label
        text medication_name
        text severity
        timestamptz created_at
        uuid created_by FK
    }
    messages {
        uuid id PK
        uuid child_id FK
        uuid sender_id FK
        text content
        message_status status
        timestamptz created_at
    }
    auth_users {
        uuid id PK
    }

    auth_users ||--|| profiles : "id"
    profiles ||--o{ children : "cree (created_by)"
    profiles ||--o{ family_members : "profile_id"
    children ||--o{ family_members : "child_id"
    profiles ||--o{ events : "cree (created_by)"
    children ||--o{ events : "child_id"
    profiles ||--o{ messages : "envoie (sender_id)"
    children ||--o{ messages : "child_id"
