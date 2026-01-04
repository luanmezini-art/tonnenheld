import { EmailTemplate } from '@/components/email-template';
import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const apiKey = process.env.RESEND_API_KEY;
const resend = new Resend(apiKey);

export async function POST(request: Request) {
    if (!apiKey) {
        return NextResponse.json({ error: 'Missing RESEND_API_KEY' }, { status: 500 });
    }

    try {
        const body = await request.json();
        const { customerName, customerAddress, binType, serviceDate, serviceScope } = body;

        const { data, error } = await resend.emails.send({
            from: 'Tonnenheld Bot <onboarding@resend.dev>',
            to: ['luan.mezini@gmx.de'], // YOUR REGISTERED EMAIL
            subject: `Neuer Auftrag: ${customerName} (${binType})`,
            react: <EmailTemplate
                customerName={customerName}
                customerAddress={customerAddress}
                binType={binType}
                serviceDate={serviceDate}
                serviceScope={serviceScope}
            />,
        });

        if (error) {
            return NextResponse.json({ error: error.message || 'Resend Error', details: error }, { status: 500 });
        }

        return NextResponse.json({ data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
