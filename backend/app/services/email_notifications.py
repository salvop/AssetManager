import logging
import smtplib
from email.message import EmailMessage

from app.core.config import settings
from app.models.asset import Asset
from app.models.employee import Employee
from app.models.maintenance import MaintenanceTicket
from app.models.user import User

logger = logging.getLogger(__name__)


class EmailNotificationService:
    def send_email(self, *, recipients: list[str], subject: str, body: str) -> bool:
        cleaned_recipients = list(dict.fromkeys(item.strip() for item in recipients if item and item.strip()))
        if not settings.notification_email_enabled or not cleaned_recipients or not settings.smtp_host:
            return False

        message = EmailMessage()
        sender_email = settings.smtp_from_email or settings.smtp_username
        if not sender_email:
            logger.warning("Email notifications enabled but no sender email is configured")
            return False

        message["Subject"] = subject
        message["From"] = f"{settings.smtp_from_name} <{sender_email}>"
        message["To"] = ", ".join(cleaned_recipients)
        message.set_content(body)

        if settings.smtp_use_ssl:
            with smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, timeout=10) as client:
                self._authenticate(client)
                client.send_message(message)
        else:
            with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as client:
                client.ehlo()
                if settings.smtp_use_starttls:
                    client.starttls()
                    client.ehlo()
                self._authenticate(client)
                client.send_message(message)
        return True

    def notify_asset_assigned(self, *, asset: Asset, target_employee: Employee, assigned_by_user: User) -> None:
        recipients = [target_employee.email, *settings.notification_default_recipients]
        subject = f"Asset assegnato: {asset.asset_tag}"
        body = "\n".join(
            [
                f"L'asset {asset.asset_tag} - {asset.name} e stato assegnato a {target_employee.full_name}.",
                f"Assegnato da: {assigned_by_user.full_name}",
                "",
                "Accedi al sistema Asset Manager per verificare i dettagli operativi.",
            ]
        )
        self._safe_send(recipients=recipients, subject=subject, body=body)

    def notify_asset_returned(self, *, asset: Asset, previous_employee: Employee | None, returned_by_user: User) -> None:
        recipients = [previous_employee.email if previous_employee else None, *settings.notification_default_recipients]
        subject = f"Asset rientrato: {asset.asset_tag}"
        body = "\n".join(
            [
                f"L'asset {asset.asset_tag} - {asset.name} e stato registrato come rientrato.",
                f"Operazione registrata da: {returned_by_user.full_name}",
                "",
                "Verifica nel sistema se l'asset e pronto per una nuova assegnazione o per ulteriori controlli.",
            ]
        )
        self._safe_send(recipients=recipients, subject=subject, body=body)

    def notify_maintenance_ticket_opened(
        self,
        *,
        ticket: MaintenanceTicket,
        asset: Asset,
        opened_by_user: User | None,
    ) -> None:
        recipients = [opened_by_user.email if opened_by_user else None, *settings.notification_default_recipients]
        subject = f"Nuovo ticket manutenzione: {ticket.title}"
        body = "\n".join(
            [
                f"E stato aperto un ticket di manutenzione per l'asset {asset.asset_tag} - {asset.name}.",
                f"Titolo: {ticket.title}",
                f"Stato iniziale: {ticket.status}",
                "",
                "Accedi al sistema Asset Manager per prendere in carico il ticket.",
            ]
        )
        self._safe_send(recipients=recipients, subject=subject, body=body)

    def notify_maintenance_status_changed(
        self,
        *,
        ticket: MaintenanceTicket,
        asset: Asset,
        opened_by_user: User | None,
    ) -> None:
        recipients = [opened_by_user.email if opened_by_user else None, *settings.notification_default_recipients]
        subject = f"Aggiornamento ticket manutenzione: {ticket.title}"
        body = "\n".join(
            [
                f"Il ticket di manutenzione '{ticket.title}' relativo all'asset {asset.asset_tag} - {asset.name} e stato aggiornato.",
                f"Nuovo stato: {ticket.status}",
                "",
                "Accedi al sistema Asset Manager per consultare i dettagli e le azioni successive.",
            ]
        )
        self._safe_send(recipients=recipients, subject=subject, body=body)

    def _safe_send(self, *, recipients: list[str | None], subject: str, body: str) -> None:
        try:
            self.send_email(
                recipients=[item for item in recipients if item],
                subject=subject,
                body=body,
            )
        except Exception:
            logger.exception("Unable to deliver email notification", extra={"subject": subject})

    def _authenticate(self, client: smtplib.SMTP) -> None:
        if settings.smtp_username and settings.smtp_password:
            client.login(settings.smtp_username, settings.smtp_password)
