<?php
namespace App\Mailer;

// --- Load dependencies ---
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Make sure the paths to PHPMailer are correct
// These paths assume PHPMailer is in a directory parallel to 'dao'
require_once __DIR__ . '/../../Phpmailer/PHPMailer.php';
require_once __DIR__ . '/../../Phpmailer/SMTP.php';
require_once __DIR__ . '/../../Phpmailer/Exception.php';

class AppMailer {

    private $mailer;

    public function __construct() {
        $this->mailer = new PHPMailer(true); // Enable exceptions
        $this->configure();
    }

    /**
     * Configures the mailer with SMTP settings.
     * Replace with your actual SMTP credentials and settings.
     */
    private function configure() {
        try {
            // Server settings
            $this->mailer->isSMTP();
            $this->mailer->Host       = 'smtp.example.com';  // Set the SMTP server to send through
            $this->mailer->SMTPAuth   = true;
            $this->mailer->Username   = 'user@example.com';  // SMTP username
            $this->mailer->Password   = 'secret';            // SMTP password
            $this->mailer->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $this->mailer->Port       = 587;

            // Sender
            $this->mailer->setFrom('from@example.com', 'Mailer');

        } catch (Exception $e) {
            // Handle configuration errors if necessary
            error_log("Mailer configuration failed: {$this->mailer->ErrorInfo}");
        }
    }

    /**
     * Sends an email.
     *
     * @param string $toEmail The recipient's email address.
     * @param string $toName The recipient's name.
     * @param string $subject The email subject.
     * @param string $htmlBody The HTML content of the email.
     * @return bool True on success, false on failure.
     */
    public function sendEmail($toEmail, $toName, $subject, $htmlBody) {
        try {
            // Recipients
            $this->mailer->addAddress($toEmail, $toName);

            // Content
            $this->mailer->isHTML(true);
            $this->mailer->Subject = $subject;
            $this->mailer->Body    = $htmlBody;
            $this->mailer->AltBody = strip_tags($htmlBody); // Plain text version

            $this->mailer->send();
            return true;
        } catch (Exception $e) {
            error_log("Message could not be sent. Mailer Error: {$this->mailer->ErrorInfo}");
            return false;
        }
    }
}
