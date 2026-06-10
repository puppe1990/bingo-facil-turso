import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { BingoCard } from './bingo';

export async function generateEventPDF(eventName: string, cards: { cardNumber: string, numbers: BingoCard }[], footer?: string, cardsPerPage: number = 4) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 20;

  let cols = 2;
  let rows = 2;
  let cardWidth = 260;
  let cardHeight = 350;

  if (cardsPerPage === 1) {
    cols = 1; rows = 1;
    cardWidth = 500; cardHeight = 650;
  } else if (cardsPerPage === 2) {
    cols = 1; rows = 2;
    cardWidth = 500; cardHeight = 380;
  } else if (cardsPerPage === 4) {
    cols = 2; rows = 2;
    cardWidth = 260; cardHeight = 380;
  } else if (cardsPerPage === 6) {
    cols = 2; rows = 3;
    cardWidth = 260; cardHeight = 250;
  }

  for (let i = 0; i < cards.length; i += cardsPerPage) {
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    const chunk = cards.slice(i, i + cardsPerPage);
    
    chunk.forEach((card, idx) => {
      const colIdx = idx % cols;
      const rowIdx = Math.floor(idx / cols);

      const cellW = (pageWidth - 2 * margin) / cols;
      const cellH = (pageHeight - 2 * margin) / rows;

      const offsetX = margin + colIdx * cellW + (cellW - cardWidth) / 2;
      const offsetY = pageHeight - (margin + rowIdx * cellH) - (cellH - cardHeight) / 2;
      
      // Draw Card Border
      page.drawRectangle({
        x: offsetX,
        y: offsetY - cardHeight,
        width: cardWidth,
        height: cardHeight,
        borderColor: rgb(0.3, 0.3, 0.7),
        borderWidth: 2,
      });

      // Header
      const headerY = offsetY - 30;
      const nameText = eventName.length > 30 ? eventName.substring(0, 27) + '...' : eventName;
      page.drawText(nameText, { x: offsetX + 10, y: headerY, size: 14, font: boldFont, color: rgb(0, 0, 0) });
      
      const cardNumText = `CARTELA: ${card.cardNumber}`;
      const cardNumWidth = boldFont.widthOfTextAtSize(cardNumText, 10);
      page.drawText(cardNumText, { x: offsetX + cardWidth - cardNumWidth - 10, y: headerY, size: 10, font: boldFont });

      // Grid
      const letters = ['B', 'I', 'N', 'G', 'O'];
      const gridMargin = 10;
      const availableGridW = cardWidth - 2 * gridMargin;
      const colWidth = availableGridW / 5;
      
      // Calculate row height based on card height
      const footerArea = footer ? 20 : 0;
      const headerArea = 50;
      const rowHeight = (cardHeight - headerArea - footerArea - 20) / 6;

      const gridTop = offsetY - 60;
      const gridLeft = offsetX + gridMargin;

      // Draw Letters
      letters.forEach((l, col) => {
        page.drawRectangle({ 
          x: gridLeft + col * colWidth, 
          y: gridTop - rowHeight, 
          width: colWidth, 
          height: rowHeight, 
          color: rgb(0.3, 0.3, 0.7) 
        });
        
        const letterSize = Math.min(20, rowHeight * 0.6);
        page.drawText(l, { 
          x: gridLeft + col * colWidth + (colWidth - boldFont.widthOfTextAtSize(l, letterSize)) / 2, 
          y: gridTop - rowHeight + (rowHeight - letterSize) / 2 + 2, 
          size: letterSize, 
          font: boldFont, 
          color: rgb(1, 1, 1) 
        });

        // Draw Numbers
        for (let row = 0; row < 5; row++) {
          const val = (card.numbers as any)[l][row];
          const cellX = gridLeft + col * colWidth;
          const cellY = gridTop - (row + 2) * rowHeight;
          
          page.drawRectangle({
            x: cellX,
            y: cellY,
            width: colWidth,
            height: rowHeight,
            borderColor: rgb(0.8, 0.8, 0.8),
            borderWidth: 1,
          });

          const text = String(val);
          const fontSize = text === 'FREE' ? Math.min(10, rowHeight * 0.4) : Math.min(16, rowHeight * 0.5);
          page.drawText(text, {
            x: cellX + (colWidth - font.widthOfTextAtSize(text, fontSize)) / 2,
            y: cellY + (rowHeight - fontSize) / 2 + 2,
            size: fontSize,
            font: text === 'FREE' ? boldFont : font,
            color: text === 'FREE' ? rgb(0.7,0,0) : rgb(0,0,0)
          });
        }
      });

      if (footer) {
        const footerY = offsetY - cardHeight + 10;
        page.drawText(footer, { x: offsetX + 10, y: footerY, size: 8, font, color: rgb(0.5, 0.5, 0.5) });
      }
    });
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `bingo-${eventName.toLowerCase().replace(/\s+/g, '-')}.pdf`;
  link.click();
}
