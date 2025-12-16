import { useState } from "react";
import {
  FaCloudBolt,
  FaShieldHalved,
  FaShareNodes,
  FaBolt,
  FaMagnifyingGlass,
  FaDownload,
  FaEye,
  FaPenToSquare,
  FaCircleInfo,
  FaListCheck,
  FaCamera,
  FaUserGear,
  FaDatabase,
  FaArrowLeft,
  FaCalculator,
  FaChartLine,
  FaTemperatureHigh,
  FaTemperatureHalf,
  FaArrowRightArrowLeft,
  FaNetworkWired,
  FaChartArea,
  FaGaugeHigh,
  FaChartSimple,
  FaWifi,
  FaUser,
  FaTowerCell,
  FaBuildingUser,
  FaRuler,
  FaPhone,
  FaEnvelope,
  FaGithub,
  FaStar,
  FaCopyright,
  FaUserShield,
  FaUsers,
  FaBan,
  FaScaleBalanced,
  FaFilePen,
  FaXmark,
  FaCode,
  FaCompassDrafting,
} from "react-icons/fa6";
import "./AboutPage.css";

export default function AboutPage({ onBack }) {
  const [showTerms, setShowTerms] = useState(false);

  return (
    <div className="about-page">
      <header className="about-header">
        <div className="header-content">
          <button className="back-button" onClick={onBack}>
            <FaArrowLeft />
          </button>
          <h1 className="about-title">About Tools</h1>
          <div></div>
        </div>
      </header>

      <div className="about-content">
        <section className="app-section file-power-section">
          <div className="section-header-wrapper">
            <div className="app-logo file-power-logo">
              <FaCloudBolt />
            </div>
            <div className="app-info">
              <h2 className="app-name">File Power</h2>
              <span className="version-badge">Version 1.1.0</span>
            </div>
          </div>

          <div className="features-container">
            <h3 className="features-title">
              <span className="title-icon">
                <FaBolt color={"#ffc400ff"} size={"0.9rem"} />
              </span>{" "}
              Features
            </h3>
            <div className="features-grid">
              <FeatureItem icon={FaShieldHalved} text="Secure Storage" />
              <FeatureItem icon={FaShareNodes} text="Easy Sharing" />
              <FeatureItem icon={FaBolt} text="Real-time Updates" />
              <FeatureItem icon={FaMagnifyingGlass} text="Smart Search" />
              <FeatureItem icon={FaDownload} text="Quick Downloads" />
              <FeatureItem icon={FaEye} text="Built-in Viewer" />
              <FeatureItem icon={FaPenToSquare} text="File Management" />
              <FeatureItem icon={FaCircleInfo} text="File Properties" />
              <FeatureItem icon={FaListCheck} text="Activity Logs" />
              <FeatureItem icon={FaCamera} text="Log Export" />
              <FeatureItem icon={FaUserGear} text="Profile Management" />
              <FeatureItem icon={FaDatabase} text="Storage Tracking" />
            </div>
          </div>

          <div className="developers-section">
            <h3 className="features-title">
              <span className="title-icon">
                {" "}
                <FaCode color={"#ffe600ff"} size={"0.9rem"} />
              </span>{" "}
              Development Team
            </h3>
            <div className="developers-list">
              <DeveloperCard
                name="Abdur Rehman Khan"
                role="IDEA By"
                grid="500kV Rawat"
                dept="P & I"
                bps="15"
                phone="03445707580"
                email=""
                color="#2072e6"
              />
              <DeveloperCard
                name="Muhammad Rizwan"
                role="Developed By"
                github="rizwanPizzee"
                email="rizwanpizzee@gmail.com"
                phone="03335618076"
                color="#2072e6"
              />
            </div>
          </div>

          <button className="terms-button" onClick={() => setShowTerms(true)}>
            <FaScaleBalanced />
            Terms and Conditions
          </button>
        </section>

        <section className="app-section pi-tools-section">
          <div className="section-header-wrapper">
            <div className="app-logo pi-tools-logo">
              <FaCalculator />
            </div>
            <div className="app-info">
              <h2 className="app-name">P & I Tools</h2>
              <span className="version-badge">Calculators & Utilities</span>
            </div>
          </div>

          <div className="features-container">
            <h3 className="features-title">
              <span className="title-icon">
                <FaCompassDrafting color={"#ffc400ff"} size={"0.9rem"} />
              </span>{" "}
              Available Formulas
            </h3>
            <div className="features-grid">
              <FeatureItem
                icon={FaChartLine}
                text="Standard Inverse Overcurrent"
              />
              <FeatureItem
                icon={FaTemperatureHigh}
                text="Micom Relay Thermal Overload"
              />
              <FeatureItem
                icon={FaTemperatureHalf}
                text="Simens Relay Thermal Overload"
              />
              <FeatureItem
                icon={FaArrowRightArrowLeft}
                text="Impedance To Reactance"
              />
              <FeatureItem icon={FaNetworkWired} text="Siemens Diff 7UT61X" />
              <FeatureItem icon={FaChartArea} text="Siemens 7UT86 Slope" />
            </div>
          </div>

          <div className="features-container">
            <h3 className="features-title">
              <span className="title-icon">
                <FaBolt color={"#ffc400ff"} size={"0.9rem"} />
              </span>{" "}
              Features
            </h3>
            <div className="features-grid">
              <FeatureItem icon={FaGaugeHigh} text="Real-time Calculations" />
              <FeatureItem icon={FaChartSimple} text="Visual Graphs" />
            </div>
          </div>

          <div className="developers-section">
            <h3 className="features-title">
              <span className="title-icon">
                <FaCode color={"#ffe600ff"} size={"0.9rem"} />
              </span>{" "}
              Development Team
            </h3>
            <div className="developers-list">
              <DeveloperCard
                name="Naveed Ayaz"
                role="Original IDEA & Developed by (P & I Tools)"
                designation="Deputy Manager (P & I)"
                grid="500kV Rawat"
                dept="P & I"
                bps="18"
                phone="03009790412"
                email=""
                color="#00b894"
              />
              <DeveloperCard
                name="Muhammad Rizwan"
                role="Redesigned & Developed By"
                github="rizwanPizzee"
                email="rizwanpizzee@gmail.com"
                phone="03335618076"
                color="#00b894"
              />
            </div>
          </div>
        </section>
      </div>

      <footer className="about-footer">
        <p>{new Date().getFullYear()} Grid Power. All rights reserved.</p>
      </footer>

      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
    </div>
  );
}

// eslint-disable-next-line no-unused-vars
function FeatureItem({ icon: Icon, text }) {
  return (
    <div className="feature-item">
      <div className="feature-icon">
        <Icon />
      </div>
      <span>{text}</span>
    </div>
  );
}

function DeveloperCard({
  name,
  role,
  designation,
  grid,
  dept,
  bps,
  phone,
  email,
  // github,
  color,
}) {
  return (
    <div className="developer-card" style={{ "--accent-color": color }}>
      <div className="dev-avatar" style={{ backgroundColor: color }}>
        <FaUser />
      </div>
      <div className="dev-details">
        <h4 className="dev-name">{name}</h4>
        <span className="dev-role">{role}</span>
        {designation && (
          <div className="dev-info-item">
            <FaStar />
            <span>Designation: {designation}</span>
          </div>
        )}
        {grid && (
          <div className="dev-info-item">
            <FaTowerCell />
            <span>Grid Address: {grid}</span>
          </div>
        )}
        {dept && (
          <div className="dev-info-item">
            <FaBuildingUser />
            <span>Department: {dept}</span>
          </div>
        )}
        {bps && (
          <div className="dev-info-item">
            <FaRuler />
            <span>BPS: {bps}</span>
          </div>
        )}
        {phone && (
          <div className="dev-info-item">
            <FaPhone />
            <span>{phone}</span>
          </div>
        )}
        {email && (
          <div className="dev-info-item">
            <FaEnvelope />
            <span>{email}</span>
          </div>
        )}
        {/* {github && (
          <div className="dev-info-item">
            <FaGithub />
            <span>{github}</span>
          </div>
        )} */}
        <div className="dev-contact-row">
          {phone && (
            <a href={`tel:${phone}`} className="contact-btn" title="Call">
              <FaPhone />
            </a>
          )}
          {email && (
            <a href={`mailto:${email}`} className="contact-btn" title="Email">
              <FaEnvelope />
            </a>
          )}
          {/* {github && (
            <a
              href={`https://github.com/${github}`}
              target="_blank"
              rel="noreferrer"
              className="contact-btn"
              title="GitHub"
            >
              <FaGithub />
            </a>
          )} */}
        </div>
      </div>
    </div>
  );
}

function TermsModal({ onClose }) {
  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">Terms & Conditions</h2>
          <button className="close-modal-button" onClick={onClose}>
            <FaXmark />
          </button>
        </div>
        <div className="modal-body">
          <TermsSection
            number="1"
            title="Introduction"
            text="Welcome to File Power. By using our app, you agree to these terms. Please read them carefully."
            icon={FaCircleInfo}
          />
          <TermsSection
            number="2"
            title="Privacy Policy"
            text="We value your privacy. Your data is stored securely and is not shared with third parties without your consent. We collect only the information necessary to provide our services."
            icon={FaUserShield}
          />
          <TermsSection
            number="3"
            title="Data Deletion"
            text="You have the right to delete your data at any time."
            icon={FaDatabase}
          />
          <TermsSection
            number="4"
            title="User Conduct"
            text="You agree not to use the app for any unlawful purpose or in any way that could damage, disable, overburden, or impair the service. Respect other users and their privacy."
            icon={FaUsers}
          />
          <TermsSection
            number="5"
            title="Intellectual Property"
            text="All content, features, and functionality are owned by File Power."
            icon={FaCopyright}
          />
          <TermsSection
            number="6"
            title="Termination"
            text="We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms."
            icon={FaBan}
          />
          <TermsSection
            number="7"
            title="Liability"
            text="In no event shall File Power be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses."
            icon={FaScaleBalanced}
          />
          <TermsSection
            number="8"
            title="Changes to Terms"
            text="We reserve the right to modify these terms at any time. Your continued use of the app constitutes your agreement to the modified terms."
            icon={FaFilePen}
          />
          <TermsSection
            number="9"
            title="Contact Us"
            text="If you have any questions about these Terms, please contact us at rizwanpizzee@gmail.com."
            icon={FaEnvelope}
          />
        </div>
      </div>
    </div>
  );
}

// eslint-disable-next-line no-unused-vars
function TermsSection({ number, title, text, icon: Icon }) {
  return (
    <div className="terms-section">
      <h4>
        <Icon style={{ marginRight: 8, color: "#c6e3ff" }} />
        {number}. {title}
      </h4>
      <p style={{ marginLeft: 24, fontSize: "0.9rem" }}>{text}</p>
    </div>
  );
}
