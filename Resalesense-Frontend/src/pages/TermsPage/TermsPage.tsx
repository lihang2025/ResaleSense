import React from 'react';
import './TermsPage.css';

const TermsPage: React.FC = () => {
  return (
    <div className="page-container terms-page">
      <h1 className="terms-title">Terms and Conditions</h1>
      <p className="terms-updated">Last Updated: {new Date().toLocaleDateString()}</p>

      <div className="terms-content card">
        <section>
          <h2>1. Introduction</h2>
          <p>
            Welcome to ResaleSense. By accessing our website, you agree to comply with
            and be bound by the following terms and conditions of use, which together
            with our privacy policy govern ResaleSense's relationship with you in
            relation to this website.
          </p>
        </section>

        <section>
          <h2>2. User Conduct and Responsibilities</h2>
          <p>
            You agree to use this website only for lawful purposes. You are
            prohibited from posting on or transmitting through the site any
            unlawful, harmful, threatening, abusive, harassing, defamatory,
            vulgar, obscene, sexually explicit, profane, hateful, or otherwise
            objectionable material of any kind.
          </p>
          <ul>
            <li>
              You agree not to submit false or misleading information, including
              in community valuations or remarks.
            </li>
            <li>
              You agree not to impersonate any person or entity or falsely state
              or otherwise misrepresent your affiliation with a person or entity.
            </li>
            <li>
              You agree not to engage in spamming, "phishing," or any other
              activity intended to harm others.
            </li>
          </ul>
        </section>

        <section>
          <h2>3. Community Features (Valuations and Remarks)</h2>
          <p>
            Our community features are provided for informational purposes only.
            Opinions and valuations expressed by users do not represent the
            opinions of ResaleSense. We are not responsible for the accuracy,
            completeness, or usefulness of any user-generated content.
          </p>
        </section>

        <section>
          <h2>4. Account Suspension and Termination (Flagging & Banning)</h2>
          <p>
            ResaleSense reserves the right, at its sole discretion, to
            investigate any potential violations of these Terms and Conditions
            and to take appropriate action.
          </p>
          <ul>
            <li>
              <strong>Flagging:</strong> We may issue warnings ("flags") for
              conduct that, while not warranting immediate suspension, is deemed
              inappropriate or in violation of these terms.
            </li>
            <li>
              <strong>"Two-Strike" Policy:</strong> A user who receives a
              warning ("flag") for a first violation will be notified. A
              second violation and flag will result in an automatic account
              suspension (ban) for a period of 7 days.
            </li>
            <li>
              <strong>Suspension/Banning:</strong> We reserve the right to
              suspend or permanently ban your account and restrict your access to
              the website, without notice, for any conduct that we, in our
              sole discretion, believe is in violation of these terms, any
              applicable law, or is harmful to the interests of other users or
              ResaleSense.
            </li>
            <li>
              Grounds for suspension or banning include, but are not limited to,
              repeated submission of spam, harassment of other users, submission
              of malicious content, or attempts to manipulate community
              valuations.
            </li>
          </ul>
        </section>

        <section>
          <h2>5. Disclaimer of Warranties</h2>
          <p>
            All information, including AI-powered price predictions, is
            provided "as is" without warranty of any kind. ResaleSense makes no
            representations as to the accuracy, completeness, or reliability of
            any information provided. You agree that you use this information at
            your own risk.
          </p>
        </section>
      </div>
    </div>
  );
};

export default TermsPage;