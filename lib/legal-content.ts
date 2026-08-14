export type LegalSection = {
  heading: string;
  body: string[];
};

// Sections are stored/edited as a single markdown-lite string ("## Heading"
// lines + blank-line-separated paragraphs) so the admin can edit an entire
// document in one textarea, while the public dialog still renders it as
// clean structured sections.
export function sectionsToMarkdown(sections: LegalSection[]): string {
  return sections
    .map((s) => `## ${s.heading}\n\n${s.body.join("\n\n")}`)
    .join("\n\n");
}

export function markdownToSections(markdown: string): LegalSection[] {
  const blocks = markdown.split(/\n(?=## )/).map((b) => b.trim()).filter(Boolean);
  return blocks.map((block) => {
    const [firstLine, ...rest] = block.split("\n");
    const heading = firstLine.replace(/^##\s*/, "").trim();
    const body = rest
      .join("\n")
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);
    return { heading, body };
  });
}

export function getPrivacyPolicySections(saccoName: string): LegalSection[] {
  return [
    {
      heading: "1. Introduction",
      body: [
        `${saccoName} ("the Sacco", "we", "us", or "our") is a savings and credit cooperative registered and operating in Kenya. This Privacy Policy explains how we collect, use, disclose, and safeguard the personal data of our members, guarantors, and users of this Management Information System ("the Platform") in accordance with the Data Protection Act, 2019 (Kenya) and the SACCO Societies Act, 2008.`,
        `By registering as a member, accessing your member portal, or otherwise using the Platform, you acknowledge that you have read and understood this Policy. If you do not agree with any part of it, please contact us before continuing to use the Platform.`,
      ],
    },
    {
      heading: "2. Information We Collect",
      body: [
        `We collect information that you or our staff provide directly, including: your full name, national identity number, date of birth, gender, phone number, email address, postal and residential address, occupation and employer, next of kin details, and a profile photograph where provided.`,
        `We also collect financial and transactional information generated through your use of the Platform, including savings and shares balances, deposit and withdrawal records, loan applications, guarantor relationships, loan repayment history, contribution records, and dividend payouts.`,
        `We automatically collect limited technical information when you access the Platform, such as login timestamps, device and session information, and actions taken within your account, for the purposes of security and audit logging described below.`,
      ],
    },
    {
      heading: "3. How We Use Your Information",
      body: [
        `We process your personal data to: administer your membership and accounts; assess and process loan applications, including verifying guarantor relationships and loan-to-savings eligibility; process deposits, withdrawals, contributions, and dividend distributions; communicate with you regarding your account, loan status, guarantor requests, and Sacco announcements; maintain statutory registers and financial records as required of a registered Sacco; detect and prevent fraud; and comply with our legal and regulatory obligations, including those under the SACCO Societies Act and any applicable anti-money laundering requirements.`,
        `We do not use your personal data for automated decision-making that produces legal effects concerning you without human review. Loan approvals are reviewed by an authorised Sacco official before being finalised.`,
      ],
    },
    {
      heading: "4. Legal Basis for Processing",
      body: [
        `We process your personal data on the following legal bases recognised under the Data Protection Act, 2019: performance of the membership contract between you and the Sacco; compliance with our legal obligations as a registered cooperative society; your explicit consent, where required, such as when you nominate a guarantor or opt in to certain communications; and our legitimate interests in operating a secure, accurately audited financial platform, balanced against your rights and freedoms.`,
      ],
    },
    {
      heading: "5. Sharing and Disclosure of Information",
      body: [
        `We do not sell your personal data. We may share limited information in the following circumstances: with a guarantor or borrower, but strictly limited to the borrower's name and the loan amount being guaranteed — never account balances or other financial details; with our auditors, regulators (including SASRA where applicable), or law enforcement where required by law; with service providers who process data on our behalf (such as our cloud hosting and database provider) under contractual confidentiality obligations; and with your next of kin only in circumstances contemplated by our membership terms, such as succession of a deceased member's account.`,
      ],
    },
    {
      heading: "6. Data Retention",
      body: [
        `We retain your personal data for as long as you remain a member of the Sacco, and thereafter for the period required by the SACCO Societies Act, applicable tax and financial record-keeping laws, and our internal record retention policy, after which it is securely deleted or anonymised, save for information we are legally obliged to retain for longer.`,
      ],
    },
    {
      heading: "7. Your Rights",
      body: [
        `Under the Data Protection Act, 2019, you have the right to: be informed of the use to which your personal data is to be put; access your personal data in our custody; object to the processing of all or part of your personal data; correct any false or misleading data concerning you; and request deletion of false or misleading data concerning you.`,
        `To exercise these rights, contact us using the details in Section 10. We will respond within the timeframes prescribed by law. Certain rights may be limited where we have an overriding legal or regulatory obligation to retain financial records.`,
      ],
    },
    {
      heading: "8. Data Security",
      body: [
        `We apply technical and organisational safeguards appropriate to the sensitivity of financial data, including role-based access control (members and administrators can only access data relevant to their role), encrypted data transmission, secure credential storage, and a comprehensive audit log recording every material action taken on the Platform for accountability and incident investigation.`,
        `While we take reasonable steps to protect your information, no system is completely secure. You are responsible for keeping your login PIN confidential and for notifying us immediately if you suspect unauthorised access to your account.`,
      ],
    },
    {
      heading: "9. Cookies and Similar Technologies",
      body: [
        `The Platform uses strictly necessary session cookies and local storage to keep you signed in and to remember your preferences. We do not use third-party advertising or tracking cookies.`,
      ],
    },
    {
      heading: "10. Contact Us",
      body: [
        `For questions about this Privacy Policy or to exercise your data protection rights, please contact the Sacco through the details provided on our website or at our registered office. You also have the right to lodge a complaint with the Office of the Data Protection Commissioner, Kenya.`,
      ],
    },
    {
      heading: "11. Changes to This Policy",
      body: [
        `We may update this Privacy Policy from time to time to reflect changes in our practices or legal obligations. Material changes will be communicated to members through the Platform's announcements feature. The date of the last update is shown at the top of this document when published.`,
      ],
    },
  ];
}

export function getTermsOfServiceSections(saccoName: string): LegalSection[] {
  return [
    {
      heading: "1. Acceptance of Terms",
      body: [
        `These Terms of Service ("Terms") govern your access to and use of the ${saccoName} member Platform. By logging in and using the Platform, you agree to be bound by these Terms, our Privacy Policy, and the Sacco's registered by-laws. If you do not agree, you should not use the Platform and should raise your concerns with the Sacco directly.`,
      ],
    },
    {
      heading: "2. Membership and Eligibility",
      body: [
        `Access to the Platform is provided exclusively to registered members of the Sacco and authorised staff. Membership is subject to the Sacco's by-laws, including eligibility criteria, minimum share capital requirements, and the payment of any applicable registration fee. The Sacco reserves the right to suspend or terminate membership in accordance with its by-laws and applicable law, including for non-compliance with these Terms.`,
      ],
    },
    {
      heading: "3. Your Account and Login Credentials",
      body: [
        `Your account is identified by your registered phone number and a personal PIN. You are responsible for keeping your PIN confidential and must not share it with any other person, including staff. You must notify the Sacco immediately if you suspect your account has been compromised. The Sacco is not liable for losses arising from your failure to safeguard your login credentials.`,
      ],
    },
    {
      heading: "4. Savings, Shares, and Contributions",
      body: [
        `Deposits, withdrawals, and contributions recorded on the Platform are processed by authorised Sacco staff against verifiable receipts (cash, M-Pesa, or bank transfer). The balances displayed on the Platform reflect the Sacco's official records. You should promptly report any discrepancy you notice between your own records and the Platform to the Sacco's administration.`,
        `Shares carry a minimum balance requirement as set by the Sacco and may not be withdrawn below that minimum while you remain a member, except on exit from the Sacco in accordance with its by-laws.`,
      ],
    },
    {
      heading: "5. Loans and Guarantorship",
      body: [
        `Loan applications submitted through the Platform are subject to review and approval by the Sacco's credit committee or authorised officials, and approval is not guaranteed by the mere submission of an application. Loan terms, interest rates, and required guarantors are determined by the loan product selected and the Sacco's lending policy in force at the time of application.`,
        `By agreeing to guarantee another member's loan, you accept joint responsibility, to the extent set out in the Sacco's by-laws and Kenyan law, for the guaranteed amount should the borrower default. You should only agree to guarantee a loan you are able and willing to honour. Guarantor consent given on the Platform is treated as a binding acceptance equivalent to a signed guarantee form.`,
        `Late repayment attracts penalties as disclosed at the time of loan disbursement. Persistent default may result in the loan being classified as non-performing, recovery action against the borrower and guarantors, and reporting to relevant credit reference bureaus where applicable under Kenyan law.`,
      ],
    },
    {
      heading: "6. Dividends",
      body: [
        `Dividends are declared at the discretion of the Sacco's governing body, based on the Sacco's financial performance and in accordance with its by-laws and the SACCO Societies Act. Declared dividends are calculated on your shares balance as of the declaration date and credited to your savings account upon distribution.`,
      ],
    },
    {
      heading: "7. Fees and Charges",
      body: [
        `The Sacco may charge registration fees, loan processing fees, insurance fees, and other charges as disclosed within the Platform or the Sacco's published fee schedule. Fees are subject to change with reasonable notice to members through the Platform's announcements feature.`,
      ],
    },
    {
      heading: "8. Acceptable Use",
      body: [
        `You agree to use the Platform only for its intended purpose of managing your genuine membership with the Sacco. You must not attempt to access another member's account or data, interfere with the Platform's operation, or submit false information, including false loan applications or fabricated receipts. Violation of this section may result in suspension of your membership and, where applicable, referral to law enforcement.`,
      ],
    },
    {
      heading: "9. Suspension and Termination",
      body: [
        `The Sacco may suspend your access to the Platform where your membership is suspended under the Sacco's by-laws, where required for security or investigative purposes, or where you are found to be in breach of these Terms. Suspension of Platform access does not by itself terminate your underlying membership rights and obligations, which continue to be governed by the Sacco's by-laws.`,
      ],
    },
    {
      heading: "10. Limitation of Liability",
      body: [
        `The Platform is provided on an "as available" basis. While the Sacco takes reasonable care to ensure the accuracy and availability of the Platform, it does not warrant that the Platform will be uninterrupted or error-free. To the extent permitted by law, the Sacco's liability for any loss arising from your use of the Platform is limited to direct losses demonstrably caused by the Sacco's negligence, and excludes indirect or consequential losses.`,
      ],
    },
    {
      heading: "11. Dispute Resolution and Governing Law",
      body: [
        `Any dispute arising from your membership or use of the Platform should first be raised with the Sacco's administration for resolution. Unresolved disputes shall be handled in accordance with the dispute resolution procedures set out in the Sacco's by-laws and, where applicable, referred to the Cooperative Tribunal or courts of competent jurisdiction in Kenya. These Terms are governed by the laws of Kenya.`,
      ],
    },
    {
      heading: "12. Amendments",
      body: [
        `The Sacco may amend these Terms from time to time to reflect changes in its by-laws, operations, or applicable law. Continued use of the Platform after an amendment takes effect constitutes acceptance of the revised Terms. Material changes will be announced through the Platform.`,
      ],
    },
    {
      heading: "13. Contact",
      body: [
        `For questions about these Terms, please contact the Sacco through the details provided on our website or at our registered office.`,
      ],
    },
  ];
}
