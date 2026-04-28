import React, { useState } from 'react';
import './SOSAlert.css';

const SOSAlert = ({ onClose, onConfirm, busInfo }) => {
  const [step, setStep] = useState(1); // 1: confirmation, 2: details, 3: sent
  const [sosData, setSosData] = useState({
    type: 'emergency',
    description: '',
    passengersSafe: true,
    needAssistance: true
  });

  const handleConfirm = () => {
    onConfirm(sosData);
    setStep(3);
    
    // Auto close after 5 seconds
    setTimeout(() => {
      onClose();
    }, 5000);
  };

  const handleTypeChange = (type) => {
    setSosData(prev => ({ ...prev, type }));
  };

  const renderStep1 = () => (
    <div className="sos-step">
      <div className="sos-icon">🆘</div>
      <h3>Trigger SOS Alert?</h3>
      <p>This will notify emergency services and your dispatcher immediately.</p>
      
      <div className="bus-info">
        <div className="info-row">
          <span>Bus Number:</span>
          <strong>{busInfo.number}</strong>
        </div>
        <div className="info-row">
          <span>Current Location:</span>
          <strong>{busInfo.location.address}</strong>
        </div>
        <div className="info-row">
          <span>Time:</span>
          <strong>{new Date().toLocaleTimeString()}</strong>
        </div>
      </div>

      <div className="sos-actions">
        <button className="sos-btn cancel" onClick={onClose}>
          Cancel
        </button>
        <button className="sos-btn confirm" onClick={() => setStep(2)}>
          Continue
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="sos-step">
      <h3>Additional Information</h3>
      <p className="step-subtitle">Please provide more details (optional)</p>

      <div className="sos-type">
        <label>Emergency Type</label>
        <div className="type-options">
          <button 
            className={`type-btn ${sosData.type === 'emergency' ? 'active' : ''}`}
            onClick={() => handleTypeChange('emergency')}
          >
            🚑 Medical Emergency
          </button>
          <button 
            className={`type-btn ${sosData.type === 'accident' ? 'active' : ''}`}
            onClick={() => handleTypeChange('accident')}
          >
            💥 Accident
          </button>
          <button 
            className={`type-btn ${sosData.type === 'breakdown' ? 'active' : ''}`}
            onClick={() => handleTypeChange('breakdown')}
          >
            🔧 Vehicle Breakdown
          </button>
          <button 
            className={`type-btn ${sosData.type === 'security' ? 'active' : ''}`}
            onClick={() => handleTypeChange('security')}
          >
            🚔 Security Issue
          </button>
        </div>
      </div>

      <div className="sos-description">
        <label>Description</label>
        <textarea
          placeholder="Describe the situation..."
          value={sosData.description}
          onChange={(e) => setSosData(prev => ({ ...prev, description: e.target.value }))}
          rows="3"
        />
      </div>

      <div className="sos-checkboxes">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={sosData.passengersSafe}
            onChange={(e) => setSosData(prev => ({ ...prev, passengersSafe: e.target.checked }))}
          />
          <span>All passengers are safe</span>
        </label>

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={sosData.needAssistance}
            onChange={(e) => setSosData(prev => ({ ...prev, needAssistance: e.target.checked }))}
          />
          <span>Need immediate assistance</span>
        </label>
      </div>

      <div className="sos-actions">
        <button className="sos-btn cancel" onClick={() => setStep(1)}>
          Back
        </button>
        <button className="sos-btn confirm" onClick={handleConfirm}>
          Send SOS
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="sos-step">
      <div className="success-icon">✓</div>
      <h3>SOS Alert Sent!</h3>
      <p>Emergency services and your dispatcher have been notified.</p>
      
      <div className="sent-info">
        <div className="info-item">
          <span className="info-label">Alert ID:</span>
          <span className="info-value">SOS-{Date.now().toString().slice(-6)}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Time Sent:</span>
          <span className="info-value">{new Date().toLocaleTimeString()}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Estimated Response:</span>
          <span className="info-value">5-10 minutes</span>
        </div>
      </div>

      <div className="emergency-contacts">
        <h4>Emergency Contacts</h4>
        <div className="contact-item">
          <span className="contact-name">Dispatcher:</span>
          <span className="contact-number">1-800-555-0123</span>
        </div>
        <div className="contact-item">
          <span className="contact-name">Emergency:</span>
          <span className="contact-number">911</span>
        </div>
      </div>

      <button className="sos-btn close" onClick={onClose}>
        Close
      </button>
    </div>
  );

  return (
    <div className="sos-modal">
      <div className="sos-content">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </div>
    </div>
  );
};

export default SOSAlert;