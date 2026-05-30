import nodemailer from 'nodemailer';

// Beta testleri veya prod ortamı için bir mail taşıyıcısı oluşturuyoruz.
// Gerçek ortamda SMTP (örn. SendGrid, Mailgun veya Gmail) bilgileri .env'den çekilmelidir.
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT || '587'),
    auth: {
        user: process.env.SMTP_USER || 'fake_user',
        pass: process.env.SMTP_PASS || 'fake_pass',
    },
});

export const sendPasswordResetEmail = async (toEmail: string, resetToken: string) => {
    // Uygulama canlıda ise frontend URL'sini .env üzerinden alır
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    const mailOptions = {
        from: '"Cosmic Connect" <noreply@cosmicconnect.com>',
        to: toEmail,
        subject: 'Şifre Sıfırlama İsteği - Cosmic Connect',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #6C5CE7; text-align: center;">Cosmic Connect</h2>
                <p>Merhaba,</p>
                <p>Hesabınızın şifresini sıfırlamak için bir talepte bulundunuz. Aşağıdaki butona tıklayarak yeni şifrenizi belirleyebilirsiniz:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetLink}" style="background-color: #6C5CE7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Şifremi Sıfırla</a>
                </div>
                <p>Eğer butona tıklayamıyorsanız şu bağlantıyı tarayıcınıza kopyalayabilirsiniz:</p>
                <p><a href="${resetLink}">${resetLink}</a></p>
                <p style="color: #888; font-size: 12px;">Bu link 1 saat boyunca geçerlidir. Eğer bu işlemi siz yapmadıysanız bu e-postayı görmezden gelebilirsiniz.</p>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent: ${info.messageId}`);
        // Eğer Ethereal email kullanılıyorsa, terminalde test linkini göster:
        if (process.env.SMTP_HOST === 'smtp.ethereal.email') {
            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        }
    } catch (error) {
        console.error('Email sending failed:', error);
        // Hata fırlatmıyoruz, sistemin çökmesini engelliyoruz ama logluyoruz
    }
};
