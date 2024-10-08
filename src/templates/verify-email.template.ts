const generateVerifyEmailTemplate = (
  props: EmailTemplateProps,
) => `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <html dir="ltr" lang="en">
    <head>
        <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    </head>
    <div
        style="
        display: none;
        overflow: hidden;
        line-height: 1px;
        opacity: 0;
        max-height: 0;
        max-width: 0;
        "
    >
        Verify Email on VMS
        <div>
         ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿
        </div>
    </div>

    <body
        style="
        background-color: rgb(255, 255, 255);
        margin-top: auto;
        margin-bottom: auto;
        margin-left: auto;
        margin-right: auto;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
            'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif,
            'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol',
            'Noto Color Emoji';
        padding-left: 0.5rem;
        padding-right: 0.5rem;
        "
    >
        <table
        align="center"
        width="100%"
        border="0"
        cellpadding="0"
        cellspacing="0"
        role="presentation"
        style="
            max-width: 465px;
            border-width: 1px;
            border-style: solid;
            border-color: rgb(234, 234, 234);
            border-radius: 0.25rem;
            margin-top: 40px;
            margin-bottom: 40px;
            margin-left: auto;
            margin-right: auto;
            padding: 20px;
        "
        >
        <tbody>
            <tr style="width: 100%">
            <td>
                <table
                align="center"
                width="100%"
                border="0"
                cellpadding="0"
                cellspacing="0"
                role="presentation"
                style="margin-top: 32px"
                >
                <tbody>
                    <tr>
                    <td>
                        <img
                        alt="Vercel"
                        height="37"
                        src="https://react-email-demo-bdj5iju9r-resend.vercel.app/static/vercel-logo.png"
                        style="
                            display: block;
                            outline: none;
                            border: none;
                            text-decoration: none;
                            margin-top: 0px;
                            margin-bottom: 0px;
                            margin-left: auto;
                            margin-right: auto;
                        "
                        width="40"
                        />
                    </td>
                    </tr>
                </tbody>
                </table>
                <h1
                class=""
                style="
                    color: rgb(0, 0, 0);
                    font-size: 24px;
                    font-weight: 400;
                    text-align: center;
                    padding: 0px;
                    margin-top: 30px;
                    margin-bottom: 30px;
                    margin-left: 0px;
                    margin-right: 0px;
                "
                >
                Verify <strong>Email</strong> on <strong>VMS</strong>
                </h1>
                <p
                style="
                    font-size: 14px;
                    line-height: 24px;
                    margin: 16px 0;
                    color: rgb(0, 0, 0);
                    text-transform: capitalize;
                "
                >
                Hello
                <!-- -->${props.name}<!-- -->,
                </p>
                <p
                style="
                    font-size: 14px;
                    line-height: 24px;
                    margin: 16px 0;
                    color: rgb(0, 0, 0);
                "
                >
                It seems like you've requested a email reset for your account.
                We understand that sometimes we all need a little help in keeping
                our digital assets secure.<!-- -->
                <!-- <strong>Vercel</strong>. -->
                </p>
                <p
                  style="
                      font-size: 12px;
                      line-height: 24px;
                      margin: 16px 0;
                      color: rgb(102, 102, 102);
                  "
                  >
                  Click the 
                  <span style="color: rgb(0, 0, 0)">button below</span> 
                  to reset your email.
                  </p>
                <table
                align="center"
                width="100%"
                border="0"
                cellpadding="0"
                cellspacing="0"
                role="presentation"
                style="text-align: center; margin-top: 32px; margin-bottom: 32px"
                >
                <tbody>
                    <tr>
                    <td>
                        <a
                        href="${(props.main_url ? props.main_url : process.env.CLIENT_ADMIN_PANEL_URL) + props.url}"
                        style="
                            background-color: rgb(0, 0, 0);
                            border-radius: 0.25rem;
                            color: rgb(255, 255, 255);
                            font-size: 12px;
                            font-weight: 600;
                            text-decoration-line: none;
                            text-align: center;
                            padding-left: 1.25rem;
                            padding-right: 1.25rem;
                            padding-top: 0.75rem;
                            padding-bottom: 0.75rem;
                            line-height: 100%;
                            text-decoration: none;
                            display: inline-block;
                            max-width: 100%;
                            padding: 12px 20px 12px 20px;
                        "
                        target="_blank"
                        ><span
                            ><!--[if mso
                            ]><i
                                style="
                                letter-spacing: 20px;
                                mso-font-width: -100%;
                                mso-text-raise: 18;
                                "
                                hidden
                                >&nbsp;</i
                            ><!
                            [endif]--></span
                        ><span
                            style="
                            max-width: 100%;
                            display: inline-block;
                            line-height: 120%;
                            mso-padding-alt: 0px;
                            mso-text-raise: 9px;
                            "
                            >Click to Verify</span
                        ><span
                            ><!--[if mso
                            ]><i
                                style="letter-spacing: 20px; mso-font-width: -100%"
                                hidden
                                >&nbsp;</i
                            ><!
                            [endif]--></span
                        ></a
                        >
                    </td>
                    </tr>
                </tbody>
                </table>
                <hr
                style="
                    width: 100%;
                    border: none;
                    border-top: 1px solid #eaeaea;
                    border-width: 1px;
                    border-style: solid;
                    border-color: rgb(234, 234, 234);
                    margin-top: 26px;
                    margin-bottom: 26px;
                    margin-left: 0px;
                    margin-right: 0px;
                "
                />
                <p
                style="
                    font-size: 12px;
                    line-height: 24px;
                    margin: 16px 0;
                    color: rgb(102, 102, 102);
                "
                >
                This mail was intended for<!-- -->
                <span style="color: rgb(0, 0, 0); text-transform: capitalize;">${props.name}</span>. If you did
                not request this change or have any concerns about the security of
                your account, please contact our support team immediately.
                </p>
            </td>
            </tr>
        </tbody>
        </table>
    </body>
    </html>
    `;

export default generateVerifyEmailTemplate;
