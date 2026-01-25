import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { TreatmentRecord } from '../../lib/api';

// Register a clean font (optional, using default for now to avoid complexity)
// Font.register({ family: 'Inter', src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf' });

const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontSize: 10,
        fontFamily: 'Helvetica',
        color: '#333',
    },
    header: {
        marginBottom: 20,
        borderBottom: 2,
        borderBottomColor: '#0ea5e9',
        paddingBottom: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0ea5e9',
        textAlign: 'center',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 12,
        textAlign: 'center',
        color: '#666',
        marginBottom: 10,
    },
    infoSection: {
        flexDirection: 'row',
        marginBottom: 20,
        backgroundColor: '#f8fafc',
        padding: 10,
        borderRadius: 5,
    },
    infoColumn: {
        flex: 1,
    },
    infoItem: {
        marginBottom: 4,
    },
    label: {
        fontWeight: 'bold',
        color: '#64748b',
    },
    table: {
        display: 'flex',
        width: 'auto',
        marginBottom: 20,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#0ea5e9',
        color: '#fff',
        padding: 6,
        fontWeight: 'bold',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomColor: '#e2e8f0',
        borderBottomWidth: 1,
        padding: 6,
    },
    col1: { width: '10%' },
    col2: { width: '60%' },
    col3: { width: '30%', textAlign: 'right' },
    totalSection: {
        alignItems: 'flex-end',
        marginTop: 10,
        paddingRight: 10,
    },
    totalBox: {
        padding: 10,
        backgroundColor: '#0ea5e9',
        color: '#fff',
        borderRadius: 5,
        minWidth: 150,
    },
    qrSection: {
        marginTop: 30,
        alignItems: 'center',
    },
    qrImage: {
        width: 80,
        height: 80,
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        textAlign: 'center',
        color: '#94a3b8',
        borderTop: 1,
        borderTopColor: '#e2e8f0',
        paddingTop: 10,
    }
});

interface Props {
    data: TreatmentRecord;
}

const TreatmentSlip = ({ data }: Props) => {
    const items = Array.from({ length: 10 }).map((_, i) => ({
        name: data[`Medicine${i + 1}` as keyof TreatmentRecord],
        price: data[`Price${i + 1}` as keyof TreatmentRecord] as number,
    })).filter(item => item.name && item.name !== '');

    const total = items.reduce((sum, item) => sum + (item.price || 0), 0);

    return (
        <Document title={`Slip - ${data.Serial_no}`}>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <Text style={styles.title}>HEALFLOW MALIR CASE</Text>
                    <Text style={styles.subtitle}>Medical Treatment & Service Slip</Text>
                </View>

                <View style={styles.infoSection}>
                    <View style={styles.infoColumn}>
                        <View style={styles.infoItem}>
                            <Text><Text style={styles.label}>Serial No:</Text> {data.Serial_no}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text><Text style={styles.label}>Emp Name:</Text> {data.Emp_name}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text><Text style={styles.label}>Emp No:</Text> {data.Emp_no}</Text>
                        </View>
                    </View>
                    <View style={styles.infoColumn}>
                        <View style={styles.infoItem}>
                            <Text><Text style={styles.label}>Date:</Text> {new Date(data.Visit_Date).toLocaleDateString()}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text><Text style={styles.label}>Book No:</Text> {data.Book_no || '-'}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text><Text style={styles.label}>Module:</Text> {data.Treatment}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={styles.col1}>#</Text>
                        <Text style={styles.col2}>Description</Text>
                        <Text style={styles.col3}>Amount (PKR)</Text>
                    </View>
                    {items.map((item, index) => (
                        <View key={index} style={styles.tableRow}>
                            <Text style={styles.col1}>{index + 1}</Text>
                            <Text style={styles.col2}>{item.name}</Text>
                            <Text style={styles.col3}>{(item.price || 0).toLocaleString()}</Text>
                        </View>
                    ))}
                    {items.length === 0 && (
                        <View style={styles.tableRow}>
                            <Text style={{ width: '100%', textAlign: 'center', color: '#999', padding: 10 }}>No items recorded</Text>
                        </View>
                    )}
                </View>

                <View style={styles.totalSection}>
                    <View style={styles.totalBox}>
                        <Text style={{ fontSize: 14, fontWeight: 'bold' }}>Total: PKR {total.toLocaleString()}</Text>
                    </View>
                </View>

                {data.Qr_code && (
                    <View style={styles.qrSection}>
                        <Image src={data.Qr_code} style={styles.qrImage} />
                        <Text style={{ fontSize: 8, color: '#64748b', marginTop: 5 }}>Scan to verify treatment</Text>
                    </View>
                )}

                <View style={styles.footer}>
                    <Text>This is a computer-generated document. No signature is required.</Text>
                    <Text style={{ marginTop: 2 }}>Generated by HealFlow Management System</Text>
                </View>
            </Page>
        </Document>
    );
};

export default TreatmentSlip;
