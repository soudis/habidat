const texts = {	
	"amount": "Betrag",
	"BIC": "BIC",
	"choose_file": "Datei auswählen..",
	"country": "Land",
	"description": "Beschreibung",
	"email": "E-Mail Adresse",
	"file": "Datei",
	"first_name": "Vorname",
	"form_admin_add": "Administrator*innen Account erstellen",
	"form_admin_settings": "Einstellungen ändern",
	"form_contract_edit": "Kredit ändern",
	"form_contract_add": "Kredit hinzufügen",
	"form_file_add_user": "Dokument hinzufügen",
	"form_transaction_add": "Zahlung anlegen",
	"form_transaction_edit": "Zahlung bearbeiten",
	"form_user_edit": "Kreditgeber*in bearbeiten",
	"form_user_add": "Kreditgeber*in hinzufügen",
	"IBAN": "IBAN",
	"interest_rate": "Zinssatz",
	"last_name": "Nachname",
	"logo": "Logo",
	"logo_change": "Logo ändern",
	"logo_keep": "Logo beibehalten",
	"logo_upload": "Logo hochladen",
	"logo_link": "Logo-URL angeben",
	"logon_id": "Username",
	"ldap": "LDAP Account",
	"ldap_help": "Bei LDAP Accounts muss kein Passwort eingegeben werden.",
	"password": "Passwort",
	"password2": "Passwort (Wiederholung)",
    "projectname": "Projektname",
    "project_email": "Kontakt E-Mail Adresse",
    "relationship": "Beziehung zum Projekt",
    "save": "Speichern",
    "contract_status": "Vertragsstatus",
    "contract_status_unknown": "Noch kein Vertrag",
    "contract_status_sign": "Vertrag ist zu unterschreiben",
    "contract_status_sent": "Vertrag ist verschickt",
    "contract_status_complete": "Vertrag abgeschlossen",
    "no_contract": "Noch kein Vertrag angelegt",
    "notes": "Notizen",
    "payback_date": "Rückzahlungsdatum",
    "place": "Ort",
    "sign_date": "Vertragsdatum",
    "street": "Strasse, Hausnummer",
    "telno": "Telefonnummer",
    "termination_date": "Kündigungsdatum",
    "termination_type": "Kündigungsart",
    "termination_type_T": "Kündigungsfrist",
    "termination_type_P": "Laufzeit",
    "termination_type_D": "Enddatum",
    "termination_period_type_M": "Monat(e)",    
    "termination_period_type_w": "Woche(n)",
    "termination_period_type_Y": "Jahr(e)",
    "transaction_date": "Datum",
    "transaction_type": "Zahlungsart",
    "transaction_type_initial": "Einzahlung",
    "transaction_type_deposit": "Zusatzzahlung",
    "transaction_type_withdrawal": "Teilauszahlung",
    "transaction_type_termination": "Rückzahlung",
    "transaction_type_notreclaimed": "Nicht rückgefordert",
    "interest_method": "Zinsberechnung",
    "interest_method_365_compound": "ACT/365 mit Zinseszins",
    "interest_method_hint_365_compound": "Bei ACT/365 werden die Zinstage eines Jahres kalendergenau berechnet, allerdings hat das Basis-Zinsjahr immer 365 Zinstage, unabhängig von einem möglichen Schaltjahr",
    "interest_method_365_nocompound": "ACT/365 ohne Zinseszins",
    "interest_method_hint_365_nocompound": "Bei ACT/365 werden die Zinstage eines Jahres kalendergenau berechnet, allerdings hat das Basis-Zinsjahr immer 365 Zinstage, unabhängig von einem möglichen Schaltjahr",
    "zip": "PLZ"

}

exports._t = function(key, strings = undefined) {
    if(texts[key]) {
        return texts[key];
    } else {
        return '!' + key + '!';
    }
};
