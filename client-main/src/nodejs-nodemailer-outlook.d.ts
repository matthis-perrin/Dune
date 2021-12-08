declare module 'nodejs-nodemailer-outlook' {
    export function sendEmail(opts: {
        auth: {
        user: string,
        pass: string,
        },
        from: string,
        to: string,
        subject: string,
        attachments: {filename: string; content: Buffer}[],
        onError: (err: unknown) => void,
        onSuccess: (data: unknown) => void,
    });
}