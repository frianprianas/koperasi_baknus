import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

export const generateInvoicePDF = (transaction, shouldPrint = false) => {
    const doc = new jsPDF()

    // Header
    // Add Logo
    try {
        doc.addImage('/logo_koperasi.png', 'PNG', 90, 8, 30, 30);
    } catch (e) {
        console.error("Logo not found for PDF", e);
    }

    doc.setFontSize(22)
    doc.setTextColor(30, 64, 175) // Blue-800
    doc.setFont('helvetica', 'bold')
    doc.text('KOPERASI BAKTI NUSANTARA', 105, 45, { align: 'center' })

    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.setFont('helvetica', 'normal')
    doc.text('Jl. Bakti Nusantara No. 66, Bandung, Jawa Barat', 105, 52, { align: 'center' })
    doc.text('Telp: (022) 1234567 | Email: info@baktinusantara.sch.id', 105, 57, { align: 'center' })

    doc.setLineWidth(0.5)
    doc.setDrawColor(30, 64, 175)
    doc.line(15, 62, 195, 62)

    // Invoice Info
    doc.setFontSize(16)
    doc.setTextColor(0)
    doc.setFont('helvetica', 'bold')
    doc.text('INVOICE / NOTA PENJUALAN', 15, 75)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Nomor Invoice : ${transaction.invoice_number}`, 15, 85)
    doc.text(`Tanggal        : ${new Date(transaction.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 15, 90)
    doc.text(`Metode Bayar   : ${transaction.payment_type.toUpperCase()}`, 15, 95)

    doc.text('Penerima:', 140, 75)
    doc.setFont('helvetica', 'bold')
    doc.text(`${transaction.customer_name || 'Umum'}`, 140, 80)
    doc.setFont('helvetica', 'normal')
    doc.text('Status:', 140, 90)

    const statusColor = (transaction.status === 'approved' || transaction.status === 'completed') ? [22, 101, 52] : [185, 28, 28]
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2])
    doc.text(`${transaction.status.toUpperCase()}`, 140, 95)

    // Items Table
    const tableRows = transaction.details.map((item, index) => [
        index + 1,
        item.item_name,
        item.quantity,
        `Rp ${parseFloat(item.subtotal / item.quantity).toLocaleString('id-ID')}`,
        `Rp ${parseFloat(item.subtotal).toLocaleString('id-ID')}`
    ])

    doc.autoTable({
        startY: 105,
        head: [['No', 'Deskripsi Barang', 'Qty', 'Harga Satuan', 'Subtotal']], body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [30, 64, 175] },
        columnStyles: {
            0: { cellWidth: 15 },
            2: { halign: 'center', cellWidth: 20 },
            3: { halign: 'right', cellWidth: 40 },
            4: { halign: 'right', cellWidth: 40 }
        }
    })

    // Total
    const finalY = doc.lastAutoTable.finalY + 15
    doc.setFontSize(12)
    doc.setTextColor(0)
    doc.setFont('helvetica', 'bold')
    doc.text('TOTAL PEMBAYARAN:', 120, finalY)
    doc.text(`Rp ${parseFloat(transaction.total_amount).toLocaleString('id-ID')}`, 195, finalY, { align: 'right' })

    // Footer / Signatures
    const footerY = finalY + 35
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Hormat Kami,', 15, footerY)
    doc.text('Tanda Tangan Konsumen,', 140, footerY)

    doc.text('( ____________________ )', 15, footerY + 25)
    doc.text('( ____________________ )', 140, footerY + 25)

    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text('* Nota ini adalah bukti transaksi sah Koperasi Bakti Nusantara', 105, 285, { align: 'center' })

    // Save/Download or Print
    if (shouldPrint) {
        doc.autoPrint();
        const hiddFrame = document.createElement('iframe');
        hiddFrame.style.position = 'fixed';
        hiddFrame.style.width = '1px';
        hiddFrame.style.height = '1px';
        hiddFrame.style.opacity = '0.01';
        const src = doc.output('bloburl');
        hiddFrame.src = src;
        document.body.appendChild(hiddFrame);
        hiddFrame.onload = () => {
            setTimeout(() => {
                hiddFrame.contentWindow.focus();
                hiddFrame.contentWindow.print();
            }, 200);
        };
    } else {
        doc.save(`Invoice_${transaction.invoice_number}.pdf`);
    }
}
