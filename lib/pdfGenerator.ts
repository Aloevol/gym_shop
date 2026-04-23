// utils/pdfGenerator.ts
import jsPDF from 'jspdf';

export interface InvoiceData {
    orderNumber: string;
    orderDate: string;
    customer: {
        name: string;
        email: string;
        phone: string;
        address: string;
        city: string;
        district: string;
        postalCode: string;
        country: string;
    };
    items: Array<{
        title: string;
        quantity: number;
        price: number;
        type: string;
        total: number;
    }>;
    summary: {
        subtotal: number;
        shipping: number;
        total: number;
    };
    payment: {
        method: string;
        status: string;
        transactionId?: string;
    };
    shipping: {
        method: string;
        cost: number;
        estimatedDelivery: string;
    };
}

export class PDFInvoiceGenerator {
    static async generateInvoice(invoiceData: InvoiceData): Promise<void> {
        // Create PDF document
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const margin = 20;
        const contentWidth = pageWidth - (margin * 2);

        // Add logo and header
        pdf.setFillColor(247, 125, 49); // #F27D31
        pdf.rect(0, 0, pageWidth, 60, 'F');

        // Company name
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(24);
        pdf.setFont('helvetica', 'bold');
        pdf.text('FIT PRO TRADERS', pageWidth / 2, 25, { align: 'center' });

        // Invoice title
        pdf.setFontSize(16);
        pdf.text('INVOICE', pageWidth / 2, 40, { align: 'center' });

        let yPosition = 80;

        // Invoice details
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(10);

        // Left column - Invoice info
        pdf.setFont('helvetica', 'bold');
        pdf.text('Invoice Number:', margin, yPosition);
        pdf.text('Invoice Date:', margin, yPosition + 8);
        pdf.text('Order Number:', margin, yPosition + 16);

        pdf.setFont('helvetica', 'normal');
        pdf.text(`INV-${invoiceData.orderNumber}`, margin + 40, yPosition);
        pdf.text(invoiceData.orderDate, margin + 40, yPosition + 8);
        pdf.text(invoiceData.orderNumber, margin + 40, yPosition + 16);

        // Right column - Payment info
        pdf.setFont('helvetica', 'bold');
        pdf.text('Payment Method:', pageWidth - margin - 80, yPosition);
        pdf.text('Payment Status:', pageWidth - margin - 80, yPosition + 8);

        pdf.setFont('helvetica', 'normal');
        pdf.text(invoiceData.payment.method, pageWidth - margin - 40, yPosition);

        // Color code payment status
        const statusColor = this.getStatusColor(invoiceData.payment.status);
        pdf.setTextColor(statusColor.r, statusColor.g, statusColor.b);
        pdf.text(invoiceData.payment.status.toUpperCase(), pageWidth - margin - 40, yPosition + 8);
        pdf.setTextColor(0, 0, 0);

        yPosition += 40;

        // Customer information
        pdf.setFont('helvetica', 'bold');
        pdf.text('BILL TO:', margin, yPosition);
        pdf.setFont('helvetica', 'normal');
        pdf.text(invoiceData.customer.name, margin, yPosition + 8);
        pdf.text(invoiceData.customer.email, margin, yPosition + 16);
        pdf.text(invoiceData.customer.phone, margin, yPosition + 24);
        pdf.text(invoiceData.customer.address, margin, yPosition + 32);
        pdf.text(`${invoiceData.customer.city}, ${invoiceData.customer.district}`, margin, yPosition + 40);
        pdf.text(`${invoiceData.customer.postalCode}, ${invoiceData.customer.country}`, margin, yPosition + 48);

        yPosition += 70;

        // Items table header
        pdf.setFillColor(240, 240, 240);
        pdf.rect(margin, yPosition, contentWidth, 12, 'F');

        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        pdf.text('Description', margin + 5, yPosition + 8);
        pdf.text('Qty', margin + 100, yPosition + 8);
        pdf.text('Price', margin + 120, yPosition + 8);
        pdf.text('Total', pageWidth - margin - 25, yPosition + 8);

        yPosition += 15;

        // Items
        pdf.setFont('helvetica', 'normal');
        invoiceData.items.forEach((item, index) => {
            if (yPosition > 250) {
                pdf.addPage();
                yPosition = 20;
            }

            const bgColor = index % 2 === 0 ? [255, 255, 255] : [250, 250, 250];
            pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
            pdf.rect(margin, yPosition, contentWidth, 15, 'F');

            pdf.text(item.title, margin + 5, yPosition + 8);
            pdf.text(item.quantity.toString(), margin + 100, yPosition + 8);
            pdf.text(`৳ ${item.price.toLocaleString()}`, margin + 120, yPosition + 8);
            pdf.text(`৳ ${item.total.toLocaleString()}`, pageWidth - margin - 25, yPosition + 8);

            // Item type badge
            pdf.setFontSize(8);
            pdf.setTextColor(100, 100, 100);
            pdf.text(item.type.toUpperCase(), margin + 5, yPosition + 13);
            pdf.setFontSize(10);
            pdf.setTextColor(0, 0, 0);

            yPosition += 15;
        });

        yPosition += 10;

        // Summary
        const summaryStart = yPosition;

        pdf.setFont('helvetica', 'bold');
        pdf.text('Subtotal:', pageWidth - margin - 60, summaryStart);
        pdf.text('Shipping:', pageWidth - margin - 60, summaryStart + 8);
        pdf.text('Total:', pageWidth - margin - 60, summaryStart + 20);

        pdf.setFont('helvetica', 'normal');
        pdf.text(`৳ ${invoiceData.summary.subtotal.toLocaleString()}`, pageWidth - margin - 25, summaryStart);
        pdf.text(`৳ ${invoiceData.summary.shipping.toLocaleString()}`, pageWidth - margin - 25, summaryStart + 8);

        // Total with highlight
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(247, 125, 49);
        pdf.text(`৳ ${invoiceData.summary.total.toLocaleString()}`, pageWidth - margin - 25, summaryStart + 20);
        pdf.setTextColor(0, 0, 0);

        yPosition = summaryStart + 50;

        // Footer
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        pdf.text('Thank you for your business!', pageWidth / 2, yPosition, { align: 'center' });
        pdf.text('For any questions regarding this invoice, please contact support@fitprotraders.com', pageWidth / 2, yPosition + 6, { align: 'center' });
        pdf.text('FIT PRO TRADERS - Your Fitness Partner', pageWidth / 2, yPosition + 12, { align: 'center' });

        // Save the PDF
        pdf.save(`invoice-${invoiceData.orderNumber}.pdf`);
    }

    private static getStatusColor(status: string): { r: number; g: number; b: number } {
        switch (status.toLowerCase()) {
            case 'paid':
                return { r: 34, g: 197, b: 94 }; // green
            case 'pending':
                return { r: 234, g: 179, b: 8 }; // yellow
            case 'failed':
                return { r: 239, g: 68, b: 68 }; // red
            case 'refunded':
                return { r: 168, g: 85, b: 247 }; // purple
            default:
                return { r: 0, g: 0, b: 0 }; // black
        }
    }
}