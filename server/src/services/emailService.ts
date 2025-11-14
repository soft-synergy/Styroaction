import nodemailer from 'nodemailer';
import PriceModel from '../models/Price';
import RequestModel from '../models/Request';

// Configure email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

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

    const transporter = createTransporter();
    
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
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

