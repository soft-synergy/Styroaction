import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import PriceModel from '../models/Price';
import RequestModel, { IRequest } from '../models/Request';

dotenv.config();

const resolveEnv = (key: string) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
    user: resolveEnv('SMTP_USER'),
    pass: resolveEnv('SMTP_PASS'),
    },
};

const SENDER_NAME = process.env.SMTP_SENDER_NAME || 'Styroaction - giełda styropianu';
const SENDER_ADDRESS = `${SENDER_NAME} <${SMTP_CONFIG.auth.user}>`;

const transporter = nodemailer.createTransport(SMTP_CONFIG);

const getPriceTable = async (styrofoamTypeId: string) => {
  const now = new Date();
  const prices = await PriceModel.find({
    styrofoamType: styrofoamTypeId,
    validFrom: { $lte: now },
    $or: [{ validTo: null }, { validTo: { $gte: now } }],
  })
    .populate('producer')
    .populate('styrofoamType')
    .sort({ price: 1 });

  return prices;
};

export const sendPriceBreakdown = async (requestId: string): Promise<boolean> => {
  try {
    const request = await RequestModel.findById(requestId)
      .populate('styrofoamType')
      .populate('guidedItems.styrofoamType');
    if (!request) {
      throw new Error('Request not found');
    }

    const req = request as any;
    const guidedItems = Array.isArray(req.guidedItems) ? req.guidedItems : [];
    const uniqueTypes = new Map<string, any>();

    if (req.styrofoamType?._id && !uniqueTypes.has(req.styrofoamType._id.toString())) {
      uniqueTypes.set(req.styrofoamType._id.toString(), {
        styrofoamType: req.styrofoamType,
        label: req.styrofoamType.name,
      });
    }

    guidedItems.forEach((item: any, index: number) => {
      if (item?.styrofoamType?._id) {
        const key = item.styrofoamType._id.toString();
        if (!uniqueTypes.has(key)) {
          uniqueTypes.set(key, {
            styrofoamType: item.styrofoamType,
            label: item.styrofoamType.name,
          });
        }
      } else if (item?.styrofoamName) {
        const key = `manual-${index}`;
        uniqueTypes.set(key, {
          styrofoamType: null,
          label: item.styrofoamName,
        });
      }
    });

    const priceSections: string[] = [];

    for (const [key, entry] of uniqueTypes) {
      if (!entry.styrofoamType?._id) {
        priceSections.push(`
          <h3 style="color: #34495e; margin-top: 30px;">${entry.label}</h3>
          <p>Brak wybranego typu styropianu - skontaktujemy się, aby dokończyć wycenę.</p>
        `);
        continue;
      }

      const prices = await getPriceTable(entry.styrofoamType._id.toString());

    if (prices.length === 0) {
        priceSections.push(`
          <h3 style="color: #34495e; margin-top: 30px;">${entry.label}</h3>
          <p>Brak aktualnych cen w systemie dla tego typu styropianu. Skontaktujemy się z Tobą ręcznie.</p>
        `);
        continue;
      }

    const priceTable = prices
      .map((price: any, index: number) => {
        return `
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;">${index + 1}</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${price.producer.name}</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${price.price.toFixed(2)} ${price.currency}</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${price.unit}</td>
            ${price.notes ? `<td style="padding: 10px; border: 1px solid #ddd;">${price.notes}</td>` : '<td style="padding: 10px; border: 1px solid #ddd;">-</td>'}
          </tr>
        `;
      })
      .join('');

      priceSections.push(`
        <h3 style="color: #34495e; margin-top: 30px;">${entry.label}</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #3498db; color: white;">
              <th style="padding: 10px; border: 1px solid #ddd;">#</th>
              <th style="padding: 10px; border: 1px solid #ddd;">Producent</th>
              <th style="padding: 10px; border: 1px solid #ddd;">Cena</th>
              <th style="padding: 10px; border: 1px solid #ddd;">Jednostka</th>
              <th style="padding: 10px; border: 1px solid #ddd;">Uwagi</th>
            </tr>
          </thead>
          <tbody>
            ${priceTable}
          </tbody>
        </table>
      `);
    }

    const guidedItemsList =
      guidedItems.length > 0
        ? `
        <h3 style="color: #34495e; margin-top: 30px;">Twoje pozycje:</h3>
        <ul>
          ${guidedItems
            .map(
              (item: any) => `
              <li style="margin-bottom: 10px;">
                <strong>${item.useCase}</strong><br/>
                ${item.styrofoamType?.name ? `Typ: ${item.styrofoamType.name}<br/>` : item.styrofoamName ? `Typ: ${item.styrofoamName}<br/>` : ''}
                ${item.thicknessCm ? `Grubość: ${item.thicknessCm} cm<br/>` : ''}
                ${item.areaM2 ? `Powierzchnia: ${item.areaM2} m²<br/>` : ''}
                ${item.volumeM3 ? `Objętość: ${item.volumeM3.toFixed(2)} m³<br/>` : ''}
                ${item.notes ? `Uwagi: ${item.notes}<br/>` : ''}
              </li>
            `
            )
            .join('')}
        </ul>
      `
        : '';

    const manualDetailsBlock = req.manualDetails
      ? `
        <h3 style="color: #34495e; margin-top: 30px;">Opis zapotrzebowania</h3>
        <p>${req.manualDetails.replace(/\n/g, '<br/>')}</p>
      `
      : '';

    const consultationBlock = req.needsConsultation
      ? `
        <p style="margin-top: 20px;"><strong>Prośba o kontakt telefoniczny:</strong> Tak</p>
      `
      : '';

    const generalNotes = req.notes
      ? `
        <h3 style="color: #34495e; margin-top: 30px;">Uwagi</h3>
        <p>${req.notes.replace(/\n/g, '<br/>')}</p>
      `
      : '';

    const totalVolume = req.totalVolumeM3
      ? `<p><strong>Łączna objętość:</strong> ${req.totalVolumeM3.toFixed(2)} m³</p>`
      : '';

    const priceSectionsContent = priceSections.length
      ? priceSections.join('')
      : `
        <p style="margin-top: 20px;">Na ten moment nie mamy gotowych cen dla tego zamówienia. Skontaktujemy się z Tobą, aby dokończyć wycenę.</p>
      `;

    const emailHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Porównanie cen styropianu</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2c3e50;">Porównanie cen styropianu</h1>
            
            <p>Witaj ${req.name},</p>
            
            <p>Oto porównanie cen dla Twojego zapotrzebowania:</p>
            ${guidedItemsList}
            ${totalVolume}
            ${priceSectionsContent}
            ${manualDetailsBlock}
            
            <p style="margin-top: 30px;">
              <strong>Twoje dane:</strong><br>
              Kod pocztowy: ${req.postalCode}<br>
              ${req.quantity ? `Ilość: ${req.quantity}<br>` : ''}
            </p>
            
            ${consultationBlock}
            ${generalNotes}
            
            <p style="margin-top: 30px; color: #7f8c8d; font-size: 12px;">
              Ten email został wygenerowany automatycznie przez system Styrtoaction.pl
            </p>
          </div>
        </body>
      </html>
    `;
    
    await transporter.sendMail({
      from: SENDER_ADDRESS,
      to: req.email,
      subject: `Porównanie cen styropianu - Styrtoaction`,
      html: emailHTML,
    });

    // Update request status
    await RequestModel.findByIdAndUpdate(requestId, {
      status: 'sent',
      emailSentAt: new Date(),
    });

    return true;
  } catch (error) {
    console.error('Error sending price breakdown email:', error);
    return false;
  }
};

const buildRequestSummary = (request: IRequest & { guidedItems?: any[] }) => {
  const summaryItems: string[] = [];

  if (request.requestMode === 'guided' && Array.isArray(request.guidedItems)) {
    request.guidedItems.forEach((rawItem, index) => {
      const item = rawItem as any;
      summaryItems.push(`
        <div style="padding: 12px; border: 1px solid #e6ecf2; border-radius: 10px; margin-bottom: 12px; background: #f7fbff;">
          <div style="font-size: 14px; color: #0c3d5b; font-weight: 700; letter-spacing: .02em; text-transform: uppercase;">Pozycja ${index + 1}</div>
          <p style="margin: 8px 0 4px; font-weight: 600; font-size: 16px; color: #0c3d5b;">${item.useCase || 'Zapotrzebowanie'}</p>
          <p style="margin: 4px 0; color: #2b506b;">${item.styrofoamType?.name || item.styrofoamName || 'Typ do doprecyzowania'}</p>
          <p style="margin: 4px 0; color: #4a6c85;">
            ${item.thicknessCm ? `${item.thicknessCm} cm` : '—'} •
            ${item.areaM2 ? `${item.areaM2} m²` : '—'} •
            ${item.volumeM3 ? `${item.volumeM3.toFixed(2)} m³` : '—'}
          </p>
          ${item.notes ? `<p style="margin: 6px 0 0; font-size: 14px; color: #4a6c85;">Notatka: ${item.notes}</p>` : ''}
        </div>
      `);
    });
  } else if (request.manualDetails) {
    summaryItems.push(`
      <div style="padding: 16px; border: 1px dashed #c8d7e6; border-radius: 12px; background: #fefefe;">
        <p style="margin: 0; white-space: pre-line; color: #2b506b;">${request.manualDetails}</p>
      </div>
    `);
  }

  if (request.notes) {
    summaryItems.push(`
      <div style="padding: 16px; border-radius: 12px; background: #fff9ed; border: 1px solid #ffe4b5;">
        <p style="margin: 0; color: #7a4b00; font-weight: 600;">Uwagi dodatkowe:</p>
        <p style="margin: 6px 0 0; color: #8b5d00;">${request.notes}</p>
      </div>
    `);
  }

  return summaryItems.join('');
};

export const sendRequestConfirmationEmail = async (requestIdOrDoc: string | (IRequest & { _id: any })) => {
  try {
    const rawRequest =
      typeof requestIdOrDoc === 'string'
        ? await RequestModel.findById(requestIdOrDoc).populate('guidedItems.styrofoamType').populate('styrofoamType')
        : requestIdOrDoc;

    if (!rawRequest) {
      throw new Error('Request data missing for confirmation email');
    }

    const request =
      typeof (rawRequest as any).toObject === 'function'
        ? ((rawRequest as any).toObject() as IRequest & { guidedItems?: any[] })
        : (rawRequest as IRequest & { guidedItems?: any[] });

    if (!request.email) {
      throw new Error('Request data missing for confirmation email');
    }

    const summaryHtml = buildRequestSummary(request);
    const consultationBadge = request.needsConsultation
      ? `<span style="display: inline-block; margin-top: 18px; padding: 10px 16px; background: #0c3d5b; color: #fff; border-radius: 999px; font-weight: 600;">Prośba o kontakt telefoniczny</span>`
      : '';

    const recipientFirstName = (request.name || 'Kliencie').split(' ')[0];

    const emailHTML = `
      <!DOCTYPE html>
      <html lang="pl">
        <head>
          <meta charset="UTF-8" />
          <title>Styroaction – potwierdzenie zgłoszenia</title>
        </head>
        <body style="margin: 0; padding: 0; background: #f4f8fb; font-family: 'Segoe UI', Arial, sans-serif; color: #1a2c3d;">
          <div style="max-width: 640px; margin: 0 auto; padding: 32px 16px;">
            <div style="background: #ffffff; border-radius: 18px; overflow: hidden; box-shadow: 0 25px 50px rgba(12,61,91,0.08); border: 1px solid #e2ecf3;">
              <div style="background: linear-gradient(135deg, #0c3d5b, #108fdc); padding: 32px;">
                <img src="https://styroaction.pl/logo-styroaction.png" alt="Styroaction" style="width: 180px; display: block; margin-bottom: 24px;" />
                <p style="color: rgba(255,255,255,0.85); letter-spacing: 0.2em; text-transform: uppercase; font-size: 13px; margin: 0 0 8px;">Potwierdzenie zgłoszenia</p>
                <h1 style="color: #fff; font-size: 32px; margin: 0;">Dziękujemy za zaufanie!</h1>
              </div>

              <div style="padding: 32px;">
                <p style="font-size: 18px; margin: 0 0 16px;">
                  Cześć ${recipientFirstName},
                </p>

                <p style="margin: 0 0 16px; line-height: 1.7;">
                  Twoje zapytanie właśnie trafiło na naszą giełdę. Przydzieliliśmy do Ciebie konsultanta, który dopilnuje, byś dostał najlepsze ceny z rynku.
                </p>

                <div style="border-radius: 18px; border: 1px solid #d3e2f2; padding: 20px; background: #f7fbff; display: flex; flex-wrap: wrap; gap: 16px; align-items: center;">
                  <div>
                    <p style="margin: 0; font-size: 13px; letter-spacing: .2em; text-transform: uppercase; color: #0c3d5b;">Twój konsultant</p>
                    <p style="margin: 6px 0 0; font-size: 20px; font-weight: 700; color: #0c3d5b;">Antoni Seba</p>
                    <p style="margin: 2px 0 0; font-size: 16px; color: #2b506b;">+48 576 205 389</p>
                  </div>
                  <a href="tel:+48576205389" style="margin-left: auto; padding: 12px 20px; background: #0c3d5b; color: #fff; text-decoration: none; border-radius: 999px; font-weight: 600;">
                    Połącz teraz
                  </a>
                </div>

                <div style="margin: 24px 0 0;">
                  <p style="margin: 0 0 8px; font-size: 15px; text-transform: uppercase; letter-spacing: 0.15em; color: #7d91a5;">Co się dzieje dalej?</p>
                  <ul style="margin: 0; padding-left: 20px; color: #2b506b; line-height: 1.7;">
                    <li>Już zbieramy wyceny od fabryk i hurtowni najbliżej Twojej lokalizacji.</li>
                    <li>Porównamy dostępność, terminy i transport, żebyś dostał pełen obraz.</li>
                    <li>Skontaktujemy się telefonicznie lub mailowo, gdy tylko będziemy mieć wyniki.</li>
                  </ul>
                </div>

                ${consultationBadge}

                ${
                  summaryHtml
                    ? `
                  <div style="margin-top: 32px;">
                    <p style="margin: 0 0 12px; font-size: 15px; text-transform: uppercase; letter-spacing: 0.15em; color: #7d91a5;">Twoje zapotrzebowanie</p>
                    ${summaryHtml}
                  </div>
                `
                    : ''
                }

                <div style="margin-top: 32px; padding: 20px; border-radius: 16px; background: #0c3d5b; color: #fff;">
                  <p style="margin: 0; font-size: 18px; font-weight: 600;">Jesteśmy w kontakcie</p>
                  <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); line-height: 1.7;">
                    Ten email wysłaliśmy, żeby dać Ci znać, że pracujemy nad Twoją wyceną. Jeśli masz dodatkowe informacje – odpowiedz na tę wiadomość lub zadzwoń bezpośrednio do Antoniego.
                  </p>
                </div>
              </div>

              <div style="padding: 20px 32px; background: #f0f5f9; border-top: 1px solid #e2ecf3;">
                <p style="margin: 0; font-size: 13px; color: #5c768d;">
                  Styroaction – giełda styropianu • styroaction.pl • +48 576 205 389
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    await transporter.sendMail({
      from: SENDER_ADDRESS,
      to: request.email,
      subject: 'Styroaction – potwierdzamy przyjęcie zapytania',
      html: emailHTML,
    });

    return true;
  } catch (error) {
    console.error('Error sending request confirmation email:', error);
    return false;
  }
};

