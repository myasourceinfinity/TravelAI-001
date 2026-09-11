import React, { useState } from 'react';
import './Contact.css';

//../../assets/images/contact-kyoto.webp
import contactKyoto from '../../assets/images/contact-kyoto.webp';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required.';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address.';
    }
    if (!formData.message.trim()) newErrors.message = 'Message is required.';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setStatus('');

    try {
      setStatus('Message sent successfully! We will get back to you soon.');
      setFormData({ name: '', email: '', message: '' });
    } catch (err) {
      setStatus('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contact-page-wrapper">
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <main id="main">
        <section className="container contact-top" aria-labelledby="contact-heading">
          <div className="contact-grid">
            
            {/* Left Image Section */}
            <div className="contact-media">
              <img
                className="contact-media__img"
                src={contactKyoto}
                width="1150"
                height="767"
                alt="A woman in a kimono walking a historic Kyoto street at sunset"
                fetchPriority="high"
                decoding="async"
                onError={(e) => {
                  console.error('Image failed to load. Checking public path fallback...');
                  e.target.onerror = null; 
                  e.target.src = '/assets/images/contact-kyoto.webp'; // Fallback to public directory
                }}
              />
            </div>

            {/* Form Section */}
            <div className="contact-form-wrap">
              <p className="contact-eyebrow">Contacts</p>
              <h1 className="contact-heading" id="contact-heading">
                Get in touch
              </h1>
              <p className="contact-sub">Contact the Travel AI team today!</p>

              <form className="contact-form" onSubmit={handleSubmit} noValidate aria-describedby="form-status">
                <div className="form-row">
                  <div className="field">
                    <label className="field__label" htmlFor="cf-name">Name</label>
                    <input
                      className={`field__input ${errors.name ? 'field__input--error' : ''}`}
                      type="text"
                      id="cf-name"
                      name="name"
                      placeholder="Name"
                      autoComplete="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                    {errors.name && <p className="field__error" role="alert">{errors.name}</p>}
                  </div>

                  <div className="field">
                    <label className="field__label" htmlFor="cf-email">Email</label>
                    <input
                      className={`field__input ${errors.email ? 'field__input--error' : ''}`}
                      type="email"
                      id="cf-email"
                      name="email"
                      placeholder="Enter your email"
                      autoComplete="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                    {errors.email && <p className="field__error" role="alert">{errors.email}</p>}
                  </div>
                </div>

                <div className="field">
                  <label className="field__label" htmlFor="cf-message">Message</label>
                  <textarea
                    className={`field__input ${errors.message ? 'field__input--error' : ''}`}
                    id="cf-message"
                    name="message"
                    rows="3"
                    placeholder="Message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                  ></textarea>
                  {errors.message && <p className="field__error" role="alert">{errors.message}</p>}
                </div>

                <div className="contact-form__actions">
                  <button className="btn-hero" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Sending...' : 'Submit'}
                    <span className="btn-hero__icon" aria-hidden="true">
                      <svg className="icon icon--arrow" viewBox="0 0 9 9" focusable="false">
                        <path
                          d="M2.25 6.75 6.75 2.25M6.75 5.76V2.25H3.24"
                          stroke="currentColor"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </button>
                  {status && (
                    <p className="form-status" id="form-status" role="status" aria-live="polite">
                      {status}
                    </p>
                  )}
                </div>
              </form>
            </div>

          </div>
        </section>
      </main>
    </div>
  );
}