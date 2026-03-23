import React from 'react';
import { Link } from 'react-router-dom';
import './pages.css';

const Privacy = () => {
    return (
        <div className="page-gradient-bg">
            <div className="container mx-auto px-6 py-8 max-w-5xl">
                {/* Breadcrumb */}
                <div className="text-sm text-text-muted mb-6 flex gap-2">
                    <Link to="/" className="hover:text-primary transition-colors">Home</Link>
                    <span>/</span>
                    <span>Privacy Policy</span>
                </div>

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold mb-4 pb-4 border-b border-gray-300">
                        Privacy Statement Techbyte
                    </h1>
                </div>

                {/* Content */}
                <div className="bg-white rounded-lg p-8 shadow-sm">
                    <p className="mb-6 text-gray-700">
                        <strong>Techbyte</strong>, located at Abberdaan 210, 1046AB in Amsterdam, is responsible for the processing
                        of personal data as shown in this privacy statement.
                    </p>

                    <div className="mb-6">
                        <strong className="block mb-2">Contact details:</strong>
                        <p className="text-gray-700">
                            <a href="https://techbyte.nl" className="text-primary hover:underline">https://techbyte.nl</a><br />
                            Abberdaan 210, 1046AB in Amsterdam<br />
                            0850161360
                        </p>
                    </div>

                    <h3 className="text-2xl font-bold mt-8 mb-4 pb-3 border-b border-gray-200">
                        Personal data that we process
                    </h3>
                    <p className="mb-4 text-gray-700">
                        Techbyte processes your personal data because you use our services and/or because you provide it to us yourself.
                        Below you will find an overview of the personal data that we process:
                    </p>
                    <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
                        <li>First and last name</li>
                        <li>Address details</li>
                        <li>Telephone number</li>
                        <li>Email address</li>
                        <li>IP address</li>
                        <li>Other personal data that you actively provide, for example by creating a profile on this website, in correspondence, and by telephone</li>
                        <li>Location data</li>
                        <li>Data about your activities on our website</li>
                        <li>Data about your browsing behavior across different websites (for example because this company is part of an advertising network)</li>
                        <li>Internet browser and device type</li>
                        <li>Bank account number</li>
                    </ul>

                    <h3 className="text-2xl font-bold mt-12 mb-4 pb-3 border-b border-gray-200">
                        Special and/or sensitive personal data that we process
                    </h3>
                    <p className="mb-6 text-gray-700">
                        Our website and/or service does not intend to collect data about website visitors who are younger than 16 years of age,
                        unless they have permission from parents or guardians. However, we cannot verify whether a visitor is older than 16.
                        We therefore recommend that parents be involved in the online activities of their children, in order to prevent data
                        about children from being collected without parental consent. If you are convinced that we have collected personal data
                        about a minor without that consent, please contact us at{' '}
                        <a href="mailto:info@techbyte.nl" className="text-primary hover:underline">info@techbyte.nl</a>,
                        and we will delete this information.
                    </p>

                    <h3 className="text-2xl font-bold mt-12 mb-4 pb-3 border-b border-gray-200">
                        For what purpose and on what basis we process personal data
                    </h3>
                    <p className="mb-4 text-gray-700">Techbyte processes your personal data for the following purposes:</p>
                    <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
                        <li>Handling your payment</li>
                        <li>To be able to call or email you if this is necessary to be able to carry out our services</li>
                        <li>To offer you the possibility to create an account</li>
                        <li>To deliver goods and services to you</li>
                        <li>Techbyte analyzes your behavior on the website in order to improve the website and to tailor the range of products and services to your preferences.</li>
                        <li>Techbyte tracks your browsing behavior across various websites with which we tailor our products and services to your needs.</li>
                        <li>Techbyte also processes personal data if we are legally obliged to do so, such as data that we need for our tax return.</li>
                    </ul>

                    <h3 className="text-2xl font-bold mt-12 mb-4 pb-3 border-b border-gray-200">
                        Automated decision-making
                    </h3>
                    <p className="mb-4 text-gray-700">
                        Techbyte takes responsibility on the basis of automated processing decisions about matters that can have (significant)
                        consequences for individuals. These are decisions taken by computer programs or systems, without a human being
                        (for example an employee of Techbyte) being involved.
                    </p>

                    <h3 className="text-2xl font-bold mt-12 mb-4 pb-3 border-b border-gray-200">
                        How long we retain personal data
                    </h3>
                    <p className="mb-6 text-gray-700">
                        Techbyte does not retain your personal data longer than is strictly necessary to realize the purposes for which your
                        data is collected.
                    </p>

                    <h3 className="text-2xl font-bold mt-12 mb-4 pb-3 border-b border-gray-200">
                        Sharing personal data with third parties
                    </h3>
                    <p className="mb-6 text-gray-700">
                        Techbyte does not sell your data to third parties and provides it only if this is necessary for the execution of our
                        agreement with you or to comply with a legal obligation. We conclude a data processing agreement (bewerkersovereenkomst)
                        with companies that process your data on our behalf to ensure the same level of security and confidentiality of your data.
                        Techbyte remains responsible for these processing operations.
                    </p>

                    <h3 className="text-2xl font-bold mt-12 mb-4 pb-3 border-b border-gray-200">
                        Cookies, or similar techniques, that we use
                    </h3>
                    <p className="mb-6 text-gray-700">
                        Techbyte uses only technical and functional cookies. And analytical cookies that do not infringe on your privacy.
                        A cookie is a small text file that is stored on your computer, tablet, or smartphone on your first visit to this website.
                        The cookies we use are necessary for the technical operation of the website and your ease of use. They ensure that the
                        website works properly and, for example, remember your preferred settings. We can also use this to optimize our website.
                        You can opt out of cookies by setting your internet browser so that it no longer stores cookies. In addition, you can
                        also delete all information previously stored via your browser settings.
                    </p>

                    <h3 className="text-2xl font-bold mt-12 mb-4 pb-3 border-b border-gray-200">
                        Viewing, modifying, or deleting data
                    </h3>
                    <p className="mb-4 text-gray-700">
                        You have the right to view, correct, or delete your personal data. In addition, you have the right to withdraw your
                        consent to the data processing or to object to the processing of your personal data by Techbyte, and you have the
                        right to data portability. This means that you can submit a request to us to send the personal data we hold about you
                        in a computer file to you or another organization mentioned by you.
                    </p>
                    <p className="mb-4 text-gray-700">
                        You can send a request for inspection, correction, deletion, data transfer of your personal data, or a request to withdraw
                        your consent or objection to the processing of your personal data to{' '}
                        <a href="mailto:info@techbyte.nl" className="text-primary hover:underline">info@techbyte.nl</a>.
                    </p>
                    <p className="mb-4 text-gray-700">
                        To ensure that the request for inspection has been made by you, we ask you to enclose a copy of your proof of identity
                        with the request. In this copy, black out your passport photo, MRZ (machine readable zone, the strip with numbers at the
                        bottom of the passport), passport number, and Citizen Service Number (BSN). This is to protect your privacy. We will
                        respond to your request as quickly as possible, but within four weeks.
                    </p>
                    <p className="mb-6 text-gray-700">
                        Techbyte would also like to point out that you have the option to file a complaint with the national supervisory authority,
                        the Dutch Data Protection Authority (Autoriteit Persoonsgegevens). This can be done via the following link:{' '}
                        <a
                            href="https://autoriteitpersoonsgegevens.nl/nl/contact-met-de-autoriteit-persoonsgegevens/tip-ons"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline break-words"
                        >
                            https://autoriteitpersoonsgegevens.nl/nl/contact-met-de-autoriteit-persoonsgegevens/tip-ons
                        </a>
                    </p>

                    <h3 className="text-2xl font-bold mt-12 mb-4 pb-3 border-b border-gray-200">
                        How we secure personal data
                    </h3>
                    <p className="mb-6 text-gray-700">
                        Techbyte takes the protection of your data seriously and takes appropriate measures to prevent misuse, loss, unauthorized
                        access, unwanted disclosure, and unauthorized modification. If you have the impression that your data is not properly secured
                        or there are indications of misuse, please contact our customer service or via{' '}
                        <a href="mailto:info@techbyte.nl" className="text-primary hover:underline">info@techbyte.nl</a>.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Privacy;
