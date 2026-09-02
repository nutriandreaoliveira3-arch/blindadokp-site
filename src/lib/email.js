const { Resend } = require('resend');

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

async function sendActivationEmail({ to, name, activationToken }) {
  if (!resend) {
    console.warn(`RESEND_API_KEY não configurado — e-mail de ativação para ${to} não foi enviado.`);
    return;
  }

  const activationUrl = `${process.env.APP_URL || 'http://localhost:3000'}/definir-senha.html?token=${activationToken}`;

  await resend.emails.send({
    from: process.env.EMAIL_FROM || 'BlindadoKP <onboarding@resend.dev>',
    to,
    subject: 'BlindadoKP — crie sua senha de acesso',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color:#1a1a1a;">Bem-vindo(a), ${name}!</h2>
        <p>Sua compra na <strong>BlindadoKP</strong> foi confirmada.</p>
        <p>Crie sua senha para acessar o conteúdo clicando no botão abaixo:</p>
        <p>
          <a href="${activationUrl}" style="display:inline-block;background:#caa34a;color:#17110a;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
            Criar minha senha
          </a>
        </p>
        <p style="font-size:13px;color:#666;">Se o botão não funcionar, copie e cole este link no navegador:<br>${activationUrl}</p>
      </div>
    `,
  });
}

async function sendPasswordResetEmail({ to, name, resetToken }) {
  if (!resend) {
    console.warn(`RESEND_API_KEY não configurado — e-mail de redefinição de senha para ${to} não foi enviado.`);
    return;
  }

  const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/definir-senha.html?token=${resetToken}`;

  await resend.emails.send({
    from: process.env.EMAIL_FROM || 'BlindadoKP <onboarding@resend.dev>',
    to,
    subject: 'BlindadoKP — redefinir sua senha',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color:#1a1a1a;">Redefinir sua senha</h2>
        <p>Olá, ${name}. Recebemos um pedido pra redefinir a senha da sua conta na <strong>BlindadoKP</strong>.</p>
        <p>Clique no botão abaixo pra criar uma senha nova (o link vale por 1 hora):</p>
        <p>
          <a href="${resetUrl}" style="display:inline-block;background:#caa34a;color:#17110a;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
            Criar nova senha
          </a>
        </p>
        <p style="font-size:13px;color:#666;">Se o botão não funcionar, copie e cole este link no navegador:<br>${resetUrl}</p>
        <p style="font-size:13px;color:#666;">Se você não pediu isso, pode ignorar este e-mail — sua senha atual continua a mesma.</p>
      </div>
    `,
  });
}

module.exports = { sendActivationEmail, sendPasswordResetEmail };
