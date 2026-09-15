export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });
  const { nom, tel, email, service, ville, message, page, _honey } = req.body || {};
  if (_honey) return res.status(200).json({ ok: true });
  if (!nom || !tel || !email) return res.status(400).json({ error: 'Champs manquants' });
  if (!process.env.RESEND_API_KEY) return res.status(503).json({ error: 'Service non configuré' });

  const esc = (s) => String(s || '').replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
  const ligne = (label, valeur, lien) => `
    <tr><td style="padding:10px 16px;border-bottom:1px solid #E8EEF5;font-size:13px;color:#5A6B7E;font-weight:700;text-transform:uppercase;letter-spacing:.04em;width:160px">${label}</td>
    <td style="padding:10px 16px;border-bottom:1px solid #E8EEF5;font-size:15px;color:#0A2C5E">${lien ? `<a href="${lien}" style="color:#1E7FE0;font-weight:700;text-decoration:none">${esc(valeur)}</a>` : esc(valeur)}</td></tr>`;

  const entete = (titre, sousTitre) => `
    <div style="background:#06172F;padding:26px 30px;border-radius:14px 14px 0 0">
      <div style="font-family:Arial Black,Arial,sans-serif;font-size:22px;font-weight:900;color:#FFFFFF;letter-spacing:.02em">PULV<span style="color:#E11D30">&amp;</span>DRONE</div>
      <div style="margin-top:6px;font-size:13px;color:#9FD4FF;letter-spacing:.08em;text-transform:uppercase">${titre}</div>
      ${sousTitre ? `<div style="margin-top:4px;font-size:13px;color:#C9DDF2">${sousTitre}</div>` : ''}
    </div>`;
  const pied = `
    <div style="padding:18px 30px;background:#F4F8FC;border-radius:0 0 14px 14px;font-size:12px;color:#8296AB;text-align:center">
      Pulv&amp;Drone · Hérouvillette (Calvados) · <a href="https://pulvdrone14.fr" style="color:#1E7FE0;text-decoration:none">pulvdrone14.fr</a><br>
      Fait avec <span style="color:#E11D30">&#10084;</span> par WebiZz Digital
    </div>`;
  const cadre = (contenu) => `
    <div style="margin:0;padding:24px 12px;background:#EDF2F8;font-family:Helvetica,Arial,sans-serif">
      <div style="max-width:600px;margin:0 auto;background:#FFFFFF;border-radius:14px;box-shadow:0 4px 20px rgba(6,23,47,.12)">${contenu}</div>
    </div>`;

  const mailEdouard = cadre(`
    ${entete('Nouvelle demande de devis', esc(page || 'Site pulvdrone14.fr'))}
    <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">
      ${ligne('Nom / Société', nom)}
      ${ligne('Téléphone', tel, 'tel:' + String(tel).replace(/\s/g, ''))}
      ${ligne('Email', email, 'mailto:' + email)}
      ${service ? ligne('Prestation', service) : ''}
      ${ville ? ligne('Commune', ville) : ''}
      ${message ? ligne('Message', message) : ''}
    </table>
    <div style="padding:22px 30px;text-align:center">
      <a href="tel:${String(tel).replace(/\s/g, '')}" style="display:inline-block;background:#E11D30;color:#FFFFFF;font-weight:800;font-size:15px;padding:13px 30px;border-radius:999px;text-decoration:none">&#128222;&nbsp;Rappeler ${esc(nom)}</a>
      <div style="margin-top:10px;font-size:12px;color:#8296AB">Répondre à cet email écrit directement au prospect.</div>
    </div>
    ${pied}`);

  const mailProspect = cadre(`
    ${entete('Demande bien reçue &#10003;')}
    <div style="padding:26px 30px;font-size:15px;line-height:1.65;color:#243B55">
      Bonjour ${esc(nom)},<br><br>
      Votre demande de devis a bien été transmise à notre équipe.
      <b>Nous revenons vers vous sous 24&nbsp;h</b> (jours ouvrés) pour étudier votre projet${ville ? ' à ' + esc(ville) : ''}.<br><br>
      Un besoin urgent&nbsp;? Appelez-nous directement&nbsp;:
    </div>
    <div style="padding:0 30px 26px;text-align:center">
      <a href="tel:+33668868968" style="display:inline-block;background:#06172F;color:#FFFFFF;font-weight:800;font-size:15px;padding:13px 30px;border-radius:999px;text-decoration:none">06&nbsp;68&nbsp;86&nbsp;89&nbsp;68</a>
    </div>
    ${pied}`);

  const envoyer = (payload) =>
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

  const r = await envoyer({
    from: 'Site Pulv&Drone <devis@pulvdrone14.fr>',
    to: ['pulvdrone14@gmail.com'],
    reply_to: email,
    subject: `Devis — ${nom}${ville ? ' (' + ville + ')' : ''} — ${page || 'pulvdrone14.fr'}`,
    html: mailEdouard,
  });
  if (!r.ok) return res.status(502).json({ error: 'envoi échoué' });

  await envoyer({
    from: 'Pulv&Drone <devis@pulvdrone14.fr>',
    to: [email],
    reply_to: 'pulvdrone14@gmail.com',
    subject: 'Votre demande de devis est bien reçue — Pulv&Drone',
    html: mailProspect,
  }).catch(() => {});

  return res.status(200).json({ ok: true });
}
