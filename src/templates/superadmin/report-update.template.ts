interface ExtendedEmailTemplateProps extends EmailTemplateProps {
  title: string;
}

export const generateReportResolvedTemplate = (
  props: ExtendedEmailTemplateProps,
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
            Update on VMS Problem Report
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
                    Update on <strong>VMS</strong> Problem Report
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
                    Dear
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
                    We wanted to inform you that we have officially closed your
                    problem report (<strong>${props.title}</strong>). We trust that
                    the issue has been resolved to your satisfaction.
                    </p>
                    <p
                    style="
                        font-size: 14px;
                        line-height: 24px;
                        margin: 16px 0;
                        color: rgb(0, 0, 0);
                    "
                    >
                    Should you encounter any further difficulties or have any
                    additional questions, please don't hesitate to create a new
                    ticket. We're here to assist you.
                    </p>
                    <p
                    style="
                        font-size: 14px;
                        line-height: 24px;
                        margin: 16px 0;
                        color: rgb(0, 0, 0);
                    "
                    >
                    We appreciate your patience and understanding as we work through
                    this. Thank you for bringing this matter to our attention, and
                    thank you for your continued support.
                    </p>
                    <p
                    style="
                        font-size: 14px;
                        line-height: 24px;
                        margin: 16px 0;
                        color: rgb(0, 0, 0);
                    "
                    >
                    Best regards,<br /><span style="text-transform: capitalize"
                        >{props.name}</span
                    >
                    </p>
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

export const generateReportWorkingOnTemplate = (
  props: ExtendedEmailTemplateProps,
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
                      Update on VMS Problem Report
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
                              Update on <strong>VMS</strong> Problem Report
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
                              Dear
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
                              We wanted to inform you that we have begun working on addressing
                              the issue you reported in your recent problem report
                              (<strong>${props.title}</strong>).
                              </p>
                              <p
                              style="
                                  font-size: 14px;
                                  line-height: 24px;
                                  margin: 16px 0;
                                  color: rgb(0, 0, 0);
                              "
                              >
                              Our team has carefully reviewed the details provided, and we are
                              actively engaged in resolving the matter. Rest assured, your
                              concern is receiving our full attention, and we are committed to
                              providing you with a prompt and satisfactory resolution.
                              </p>
                              <p
                              style="
                                  font-size: 14px;
                                  line-height: 24px;
                                  margin: 16px 0;
                                  color: rgb(0, 0, 0);
                              "
                              >
                              We appreciate your patience and understanding as we work through
                              this. Thank you for bringing this matter to our attention, and
                              thank you for your continued support.
                              </p>
                              <p
                              style="
                                  font-size: 14px;
                                  line-height: 24px;
                                  margin: 16px 0;
                                  color: rgb(0, 0, 0);
                              "
                              >
                              Best regards,<br /><span style="text-transform: capitalize"
                                  >${props.name}</span
                              >
                              </p>
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
