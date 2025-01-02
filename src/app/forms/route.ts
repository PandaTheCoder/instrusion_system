import { NextRequest, NextResponse } from 'next/server';
import { dbOperations } from '../../../db/database';
// import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

interface ViolationItem {
  date: string;
  time: string;
  camera: string;
  zone: string;
  image: string; 
}

export async function POST(req: NextRequest) {
  try{
    const body = await req.json()
    const data = await dbOperations.getViolationsByDateRange(body.startDate, body.endDate);
    const captureDataArray: ViolationItem[] = data.map((item: any) => ({
      ...item,
      image: item.image || '' // Provide a default empty string if image is undefined
    }));
   
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    
    // Use landscape orientation with more width
    const page = pdfDoc.addPage([842, 595]); // A4 landscape
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Add title
    page.drawText('Intrusion Report', {
      x: 50,
      y: height - 40,
      size: 18,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    // Prepare table configuration
    const headers = ['Camera', 'Date', 'Time', 'Zone', 'Image'];
    const columnWidths = [100, 100, 100, 100, 150];
    const startY = height - 100;
    const startX = 50;
    const imageHeight = 50; // Base image height
    const rowHeight = imageHeight * 1.1; // 10% more than image height
    const rowGap = 5; // Gap between rows

    // Color definitions
    const headerBackgroundColor = rgb(0.8, 0.8, 1); // Light blue
    const alternateRowColors = [
         // Very light blue for even rows
      rgb(1, 1, 1) ,
      rgb(0.95, 0.95, 1)         // White for odd rows
    ];
    const gapColor = rgb(1, 1, 1); // Light gray for gaps

    // Draw table header background
    page.drawRectangle({
      x: startX,
      y: startY - 15,
      width: columnWidths.reduce((a, b) => a + b, 0),
      height: 35,
      color: headerBackgroundColor,
    });

    // Draw table headers
    headers.forEach((header, index) => {
      const x = startX + columnWidths.slice(0, index).reduce((a, b) => a + b, 0);
      page.drawText(header, {
        x,
        y: startY,
        size: 10,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
    });

    // Prepare images
    const embeddedImages = [];
    for (const capture of captureDataArray) {
      try {
        const imagePath = path.join(process.cwd(), 'public' + capture.image);
        const imageBuffer = fs.readFileSync(imagePath);
        const image = await pdfDoc.embedPng(imageBuffer);
        embeddedImages.push(image);
      } catch (imgError) {
        console.error('Image embedding error:', imgError);
        embeddedImages.push(null);
      }
    }

    // Draw table rows
    captureDataArray.forEach((capture, rowIndex) => {
      // Calculate y position with gap consideration
      const y = startY - (rowIndex + 1) * (rowHeight + rowGap);
      
      // Draw row background with gap
      page.drawRectangle({
        x: startX,
        y: y,
        width: columnWidths.reduce((a, b) => a + b, 0),
        height: rowHeight,
        color: alternateRowColors[rowIndex % 2],
      });

      // Draw gap rectangle (if not the last row)
      if (rowIndex < captureDataArray.length - 1) {
        page.drawRectangle({
          x: startX,
          y: y - rowGap,
          width: columnWidths.reduce((a, b) => a + b, 0),
          height: rowGap,
          color: gapColor,
        });
      }
      
      // Row data
      const rowData = [
        capture.camera,
        capture.date,
        capture.time,
        capture.zone,
        '' // Placeholder for image
      ];

      rowData.forEach((cellData, colIndex) => {
        const x = startX + columnWidths.slice(0, colIndex).reduce((a, b) => a + b, 0);
        
        // Draw text for all columns except image
        if (colIndex !== 4) {
          page.drawText(cellData, {
            x,
            y: y + (rowHeight / 2) - 5, // Vertically center text
            size: 9,
            font: font,
            color: rgb(0, 0, 0), // Black text for better readability
          });
        }
      });

      // Draw image
      const image = embeddedImages[rowIndex];
      if (image) {
        const imageX = startX + columnWidths.slice(0, 4).reduce((a, b) => a + b, 0);
        
        // Calculate vertical center position for image
        const imageY = y + (rowHeight - imageHeight) / 2;
        
        page.drawImage(image, {
          x: imageX + 10, // Small padding
          y: imageY,
          width: imageHeight * (image.width / image.height), // Maintain aspect ratio
          height: imageHeight,
        });
      }
    });

    // Serialize the PDFDocument to bytes
    const pdfBytes = await pdfDoc.save();
    // Return response with PDF
    return new Response(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=product_catalog.pdf'
      }
    });
  }
  catch (error) {
    console.log(error)
    return NextResponse.json(
      { error: error },
      { status: 500 }
    );
  }
}