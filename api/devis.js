export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });
  const { nom, tel, email, service, ville, message, page, _honey } = req.body || {};
  if (_honey) return res.status(200).json({ ok: true });
  if (!nom || !tel || !email) return res.status(400).json({ error: 'Champs manquants' });
  if (!process.env.RESEND_API_KEY) return res.status(503).json({ error: 'Service non configuré' });

  const esc = (s) => String(s || '').replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
  const telHref = 'tel:' + String(tel).replace(/\s/g, '');

  const champ = (label, valeur) => `
    <div style="padding:15px 28px;border-bottom:1px solid #EEF3F8;text-align:center">
      <div style="font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#8FA3B8;margin-bottom:5px">${label}</div>
      <div style="font-size:16px;color:#0A2C5E;line-height:1.5">${valeur}</div>
    </div>`;

  const entete = (titre, sous) => `
    <div style="height:5px;background:#E11D30;border-radius:16px 16px 0 0;font-size:0;line-height:0">&nbsp;</div>
    <div style="background:#06172F;padding:36px 30px 30px;text-align:center">
      <img src="https://pulvdrone14.fr/logo-email.png" width="210" alt="Pulv&amp;Drone" style="display:block;margin:0 auto;max-width:210px;height:auto">
      <div style="width:30px;height:2px;background:#E11D30;margin:20px auto 16px;font-size:0;line-height:0">&nbsp;</div>
      <div style="font-size:12px;color:#9FD4FF;letter-spacing:.22em;text-transform:uppercase;font-weight:700">${titre}</div>
      ${sous ? `<div style="margin-top:8px;font-size:13px;color:#7E93AC">${sous}</div>` : ''}
    </div>`;

  const pied = `
    <div style="padding:22px 30px 24px;background:#F7FAFD;border-radius:0 0 16px 16px;text-align:center">
      <div style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#8FA3B8;font-weight:700">Pulv&amp;Drone</div>
      <div style="margin-top:6px;font-size:12px;color:#9AAAB9">Hérouvillette · Calvados · <a href="https://pulvdrone14.fr" style="color:#1E7FE0;text-decoration:none">pulvdrone14.fr</a></div>
      <div style="margin-top:10px;font-size:11px;color:#B4C1CE">Fait avec <span style="color:#E11D30">&#10084;</span> par WebiZz Digital</div>
    </div>`;

  const cadre = (contenu) => `
    <div style="margin:0;padding:28px 12px;background:#EDF2F8;font-family:Helvetica,Arial,sans-serif">
      <div style="max-width:600px;margin:0 auto;background:#FFFFFF;border-radius:16px;box-shadow:0 8px 32px rgba(6,23,47,.14)">${contenu}</div>
    </div>`;

  const mailEdouard = cadre(entete('Nouvelle demande de devis', esc(page || 'Site pulvdrone14.fr')) + `
    ${champ('Nom / Société', esc(nom))}
    ${champ('Téléphone', `<a href="${telHref}" style="color:#1E7FE0;font-weight:700;text-decoration:none">${esc(tel)}</a>`)}
    ${champ('Email', `<a href="mailto:${esc(email)}" style="color:#1E7FE0;font-weight:700;text-decoration:none">${esc(email)}</a>`)}
    ${service ? champ('Prestation', esc(service)) : ''}
    ${ville ? champ('Commune du chantier', esc(ville)) : ''}
    ${message ? `
    <div style="padding:22px 28px 6px;text-align:center">
      <div style="font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#8FA3B8;margin-bottom:10px">Message</div>
      <div style="background:#F7FAFD;border-radius:12px;padding:18px 22px;font-size:15px;font-style:italic;color:#3D5470;line-height:1.7">&laquo;&nbsp;${esc(message)}&nbsp;&raquo;</div>
    </div>` : ''}
    <div style="padding:26px 30px 30px;text-align:center">
      <a href="${telHref}" style="display:inline-block;background:#E11D30;color:#FFFFFF;font-weight:800;font-size:15px;letter-spacing:.02em;padding:14px 36px;border-radius:999px;text-decoration:none">&#128222;&nbsp;&nbsp;Rappeler ${esc(nom)}</a>
      <div style="margin-top:12px;font-size:12px;color:#9AAAB9">Ou répondez à cet email — votre réponse arrive directement chez le client.</div>
    </div>` + pied);

  const etape = (num, txt) => `
    <td style="width:33.33%;padding:0 8px;text-align:center;vertical-align:top">
      <div style="width:30px;height:30px;line-height:30px;border-radius:50%;background:#06172F;color:#9FD4FF;font-weight:800;font-size:13px;margin:0 auto 8px;text-align:center">${num}</div>
      <div style="font-size:12px;color:#5A6B7E;line-height:1.5">${txt}</div>
    </td>`;

  const mailProspect = cadre(entete('Demande bien reçue', '') + `
    <div style="padding:30px 30px 8px;text-align:center">
      <div style="width:52px;height:52px;line-height:52px;border-radius:50%;background:#EAF7EF;color:#1F9D55;font-size:24px;margin:0 auto 18px;text-align:center">&#10003;</div>
      <div style="font-size:16px;color:#243B55;line-height:1.7">
        Bonjour <b>${esc(nom)}</b>,<br>
        votre demande de devis a bien été transmise à notre équipe.
      </div>
    </div>
    <div style="padding:22px 22px 6px">
      <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse"><tr>
        ${etape(1, ville ? 'Nous étudions votre projet à ' + esc(ville) : 'Nous étudions votre projet')}
        ${etape(2, 'Réponse sous <b>24&nbsp;h</b> (jours ouvrés)')}
        ${etape(3, 'Devis <b>gratuit</b>, sans engagement')}
      </tr></table>
    </div>
    <div style="padding:26px 30px 30px;text-align:center">
      <div style="font-size:13px;color:#8FA3B8;margin-bottom:12px">Un besoin urgent&nbsp;?</div>
      <a href="tel:+33668868968" style="display:inline-block;background:#06172F;color:#FFFFFF;font-weight:800;font-size:15px;letter-spacing:.02em;padding:14px 36px;border-radius:999px;text-decoration:none">06&nbsp;68&nbsp;86&nbsp;89&nbsp;68</a>
    </div>` + pied);

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
