import { EmailTemplate } from '@/components/email-template';
import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { customerName, customerAddress, binType, serviceDate, serviceScope } = body;

        // "onboarding@resend.dev" works only for testing and sends only to the registered account email.
        // Once you have a domain, you can change 'from' to 'noreply@tonnenheld.me' and 'to' to 'info@tonnenheld.me'
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
            return NextResponse.json({ error: error }, { status: 500 });
        }

        return NextResponse.json({ data });
    } catch (error) {
        return NextResponse.json({ error: error }, { status: 500 });
    }
}
