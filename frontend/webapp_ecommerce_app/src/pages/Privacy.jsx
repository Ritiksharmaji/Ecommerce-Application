import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import Title from '../components/Title'

// Public privacy policy - linked from the Google Play listing, the mobile app and the footer.
// Keep it in sync with what the apps and backend actually collect.
const LAST_UPDATED = 'October 10, 2026'
const CONTACT_EMAIL = 'support@shopvra.space'

const Section = ({ title, children }) => (
  <section className='mb-8'>
    <h2 className='text-lg font-semibold text-primary mb-2'>{title}</h2>
    <div className='text-gray-600 leading-relaxed space-y-2'>{children}</div>
  </section>
)

const Privacy = () => {
  useEffect(() => {
    document.title = 'Privacy Policy - Shopvra'
    return () => { document.title = 'Shopvra - Fashion for everyone' }
  }, [])

  return (
    <div className='border-t pt-10 pb-16'>
      <div className='text-2xl mb-2'>
        <Title text1={'PRIVACY'} text2={'POLICY'} />
      </div>
      <p className='text-sm text-gray-500 mb-10'>Last updated: {LAST_UPDATED}</p>

      <div className='max-w-3xl'>
        <Section title='1. Who we are'>
          <p>
            Shopvra (“we”, “us”) is an online fashion store available at <b>shopvra.space</b> and through the
            Shopvra apps for Android and iOS. This policy explains what personal data we collect, why, and the
            choices you have. Questions: <a className='underline' href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </p>
        </Section>

        <Section title='2. Data we collect'>
          <ul className='list-disc ml-5 space-y-1'>
            <li><b>Account details</b> - your name, email address and password. Passwords are stored only as a secure (bcrypt) hash.</li>
            <li><b>Delivery addresses</b> - street, city, state, ZIP code and country that you save or enter at checkout.</li>
            <li><b>Orders</b> - products, sizes, quantities, prices, payment method and status, delivery notes and order history.</li>
            <li><b>Cart and wishlist</b> - the products you add, so they are available on all your devices.</li>
            <li><b>Payment information</b> - card payments are processed by <b>Stripe</b>. We never see or store your full card number; we only receive the payment result.</li>
            <li><b>Technical data</b> - our servers record basic request information (such as IP address, device/browser type and time) to keep the service secure and fix errors.</li>
          </ul>
          <p>We do <b>not</b> collect your precise location, contacts, photos (except images an administrator uploads for products), or use advertising or analytics trackers.</p>
        </Section>

        <Section title='3. How we use your data'>
          <ul className='list-disc ml-5 space-y-1'>
            <li>To create and secure your account and keep you signed in.</li>
            <li>To process, deliver and support your orders, including payments and refunds.</li>
            <li>To save your cart, wishlist and addresses.</li>
            <li>To prevent fraud and abuse, and to meet legal, tax and accounting obligations.</li>
          </ul>
          <p>We do <b>not</b> sell your personal data or share it for advertising.</p>
        </Section>

        <Section title='4. Who we share data with'>
          <p>Only with service providers that help us run Shopvra, under their own privacy and security commitments:</p>
          <ul className='list-disc ml-5 space-y-1'>
            <li><b>Stripe</b> - card payment processing.</li>
            <li><b>Amazon Web Services</b> - hosting of our website and API.</li>
            <li><b>MongoDB Atlas</b> - database hosting.</li>
            <li><b>Cloudinary</b> - storage of product images.</li>
          </ul>
          <p>We may also disclose data if required by law or to protect the rights and safety of our users.</p>
        </Section>

        <Section title='5. Data on your device'>
          <p>
            The mobile apps store your sign-in token and basic profile in the device’s secure storage
            (Android Keystore / iOS Keychain). The website keeps your sign-in token, guest cart and guest wishlist in
            your browser’s local storage. Signing out removes the token.
          </p>
        </Section>

        <Section title='6. How long we keep data'>
          <ul className='list-disc ml-5 space-y-1'>
            <li>Account, addresses, cart and wishlist - until you delete your account.</li>
            <li>Order records - kept after account deletion only as long as required by tax and accounting law, then deleted.</li>
            <li>Server logs - kept for a limited period for security and troubleshooting.</li>
          </ul>
        </Section>

        <Section title='7. Deleting your account'>
          <p>
            You can delete your account at any time in the app (<b>Profile → Delete account</b>) or on the web at{' '}
            <Link to='/delete-account' className='underline'>shopvra.space/delete-account</Link>. This permanently removes your
            account, saved addresses, cart and wishlist. You can also email us from your registered address and we will
            delete it within 7 days.
          </p>
        </Section>

        <Section title='8. Security'>
          <p>
            All data is sent over encrypted HTTPS connections. Passwords are hashed, access to our systems is restricted,
            and payment details are handled by Stripe. No method of transmission or storage is 100% secure, but we work to
            protect your data.
          </p>
        </Section>

        <Section title='9. Your rights'>
          <p>
            Depending on where you live (for example under India’s Digital Personal Data Protection Act or the EU GDPR),
            you may have the right to access, correct or delete your data, and to withdraw consent. Most details can be
            changed in your profile; for anything else contact us at{' '}
            <a className='underline' href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </p>
        </Section>

        <Section title='10. Children'>
          <p>Shopvra is intended for adults (18+). We do not knowingly collect data from children. If you believe a child has created an account, contact us and we will delete it.</p>
        </Section>

        <Section title='11. Changes to this policy'>
          <p>We may update this policy as Shopvra changes. The “last updated” date above shows the latest version; significant changes will be announced in the app or on the website.</p>
        </Section>
      </div>
    </div>
  )
}

export default Privacy
