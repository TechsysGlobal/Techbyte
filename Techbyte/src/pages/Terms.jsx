import React from 'react';
import { Link } from 'react-router-dom';
import './pages.css';

const Terms = () => {
    // Smooth scroll to section
    const scrollToSection = (e, id) => {
        e.preventDefault();
        const element = document.getElementById(id);
        if (element) {
            const offset = 120; // Adjust for header
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="page-gradient-bg">
            <div className="container mx-auto px-6 py-8 max-w-5xl">
                {/* Breadcrumb */}
                <div className="text-sm text-text-muted mb-6 flex gap-2">
                    <Link to="/" className="hover:text-primary transition-colors">Home</Link>
                    <span>/</span>
                    <span>Terms and Conditions</span>
                </div>

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-center mb-6">
                        Terms and Conditions
                    </h1>
                </div>

                {/* Table of Contents */}
                <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
                    <h3 className="text-lg font-bold mb-4 pb-3 border-b border-gray-300">
                        Table of Contents
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <a href="#art1" onClick={(e) => scrollToSection(e, 'art1')} className="text-gray-700 hover:text-primary transition-all hover:translate-x-1 block py-2">
                            Article 1 – Definitions
                        </a>
                        <a href="#art2" onClick={(e) => scrollToSection(e, 'art2')} className="text-gray-700 hover:text-primary transition-all hover:translate-x-1 block py-2">
                            Article 2 – Identity of the Seller
                        </a>
                        <a href="#art3" onClick={(e) => scrollToSection(e, 'art3')} className="text-gray-700 hover:text-primary transition-all hover:translate-x-1 block py-2">
                            Article 3 – Applicability
                        </a>
                        <a href="#art4" onClick={(e) => scrollToSection(e, 'art4')} className="text-gray-700 hover:text-primary transition-all hover:translate-x-1 block py-2">
                            Article 4 – The Offer
                        </a>
                        <a href="#art5" onClick={(e) => scrollToSection(e, 'art5')} className="text-gray-700 hover:text-primary transition-all hover:translate-x-1 block py-2">
                            Article 5 – The Agreement
                        </a>
                        <a href="#art6" onClick={(e) => scrollToSection(e, 'art6')} className="text-gray-700 hover:text-primary transition-all hover:translate-x-1 block py-2">
                            Article 6 – Reflection Period
                        </a>
                        <a href="#art7" onClick={(e) => scrollToSection(e, 'art7')} className="text-gray-700 hover:text-primary transition-all hover:translate-x-1 block py-2">
                            Article 7 – Obligations regarding returns
                        </a>
                        <a href="#art8" onClick={(e) => scrollToSection(e, 'art8')} className="text-gray-700 hover:text-primary transition-all hover:translate-x-1 block py-2">
                            Article 8 – The Price
                        </a>
                        <a href="#art9" onClick={(e) => scrollToSection(e, 'art9')} className="text-gray-700 hover:text-primary transition-all hover:translate-x-1 block py-2">
                            Article 9 – Compliance and Warranty
                        </a>
                        <a href="#art10" onClick={(e) => scrollToSection(e, 'art10')} className="text-gray-700 hover:text-primary transition-all hover:translate-x-1 block py-2">
                            Article 10 – Delivery and Execution
                        </a>
                        <a href="#art11" onClick={(e) => scrollToSection(e, 'art11')} className="text-gray-700 hover:text-primary transition-all hover:translate-x-1 block py-2">
                            Article 11 – Payment
                        </a>
                        <a href="#art12" onClick={(e) => scrollToSection(e, 'art12')} className="text-gray-700 hover:text-primary transition-all hover:translate-x-1 block py-2">
                            Article 12 – Applicable Law
                        </a>
                        <a href="#art13" onClick={(e) => scrollToSection(e, 'art13')} className="text-gray-700 hover:text-primary transition-all hover:translate-x-1 block py-2">
                            Article 13 – Additional Provisions
                        </a>
                        <a href="#art14" onClick={(e) => scrollToSection(e, 'art14')} className="text-gray-700 hover:text-primary transition-all hover:translate-x-1 block py-2">
                            Article 14 – Amendments
                        </a>
                    </div>
                </div>

                {/* Content */}
                <div className="bg-white rounded-lg p-8 shadow-sm">
                    <h3 id="art1" className="text-2xl font-bold mt-8 mb-4 pb-3 border-b-2 border-gray-800 scroll-mt-32">
                        Article 1 - Definitions
                    </h3>
                    <p className="mb-4 text-gray-700">In these conditions, the following terms have the following meanings:</p>
                    <ul className="list-disc pl-6 mb-8 space-y-2 text-gray-700">
                        <li><strong>Supplementary agreement:</strong> An agreement whereby the Consumer acquires products or digital content in connection with a distance contract and these goods are supplied by the Seller (Techbyte.nl) or by a third party on the basis of an arrangement between that third party and the Seller (Techbyte.nl);</li>
                        <li><strong>Reflection period:</strong> The period within which the Consumer can make use of their right of withdrawal;</li>
                        <li><strong>Consumer:</strong> The natural person who is not acting for purposes related to his trade, business, craft, or professional activity;</li>
                        <li><strong>Day:</strong> Calendar day;</li>
                        <li><strong>Digital content:</strong> Data produced and supplied in digital form;</li>
                        <li><strong>Durable data carrier:</strong> Any tool – including email – that enables the Consumer or Seller (Techbyte.nl) to store information addressed personally to him in a way that allows for future consultation or use for a period equal to the purpose for which the information is intended, and which allows for the unaltered reproduction of the stored information;</li>
                        <li><strong>Right of withdrawal:</strong> The possibility for the Consumer to waive the distance contract within the reflection period;</li>
                        <li><strong>Seller (Techbyte.nl):</strong> The natural or legal person who offers products remotely to the Consumer;</li>
                        <li><strong>Distance contract:</strong> An agreement concluded between the Seller (Techbyte.nl) and the Consumer within the framework of an organized system for the distance sale of products, whereby up to and including the conclusion of the agreement, exclusive or joint use is made of one or more techniques for distance communication;</li>
                        <li><strong>Model withdrawal form:</strong> The European model withdrawal form included in Appendix I of these conditions; Appendix I does not have to be made available if the Consumer has no right of withdrawal regarding their order;</li>
                        <li><strong>Technique for distance communication:</strong> Means that can be used to conclude an agreement without the Consumer and Seller (Techbyte.nl) having to be together in the same room at the same time.</li>
                    </ul>

                    <h3 id="art2" className="text-2xl font-bold mt-12 mb-4 pb-3 border-b-2 border-gray-800 scroll-mt-32">
                        Article 2 - Identity of the Seller
                    </h3>
                    <div className="bg-gray-50 border-l-4 border-primary p-6 mb-8 rounded-r-lg">
                        <p className="mb-2"><strong>Name of Seller:</strong> Unity Trading B.V.</p>
                        <p className="mb-2"><strong>Trading under the name(s):</strong> - Techbyte.nl</p>
                        <p className="mb-2"><strong>Registered address:</strong> Abberdaan 210, 1046 AB Amsterdam</p>
                        <p className="mb-2"><strong>Email address:</strong> <a href="mailto:info@techbyte.nl" className="text-primary hover:underline">info@techbyte.nl</a></p>
                        <p className="mb-2"><strong>Chamber of Commerce (KvK) number:</strong> 80337422</p>
                        <p><strong>VAT number:</strong> NL861636168B01</p>
                    </div>

                    <h3 id="art3" className="text-2xl font-bold mt-12 mb-4 pb-3 border-b-2 border-gray-800 scroll-mt-32">
                        Article 3 - Applicability
                    </h3>
                    <ul className="list-disc pl-6 mb-8 space-y-2 text-gray-700">
                        <li>These general terms and conditions apply to every offer from the Seller (Techbyte.nl) and to every distance contract concluded between the Seller (Techbyte.nl) and the Consumer.</li>
                        <li>Before the distance contract is concluded, the text of these general terms and conditions will be made available to the Consumer. If this is not reasonably possible, the Seller (Techbyte.nl) will indicate, before the distance contract is concluded, how the general terms and conditions can be viewed at the Seller (Techbyte.nl) and that they will be sent free of charge as soon as possible at the request of the Consumer.</li>
                        <li>If the distance contract is concluded electronically, strictly by way of exception to the previous paragraph and before the distance contract is concluded, the text of these general terms and conditions can be made available to the Consumer electronically in such a way that it can be stored by the Consumer in a simple manner on a durable data carrier. If this is not reasonably possible, it will be indicated before the distance contract is concluded where the general terms and conditions can be consulted electronically and that they will be sent electronically or otherwise free of charge at the request of the Consumer.</li>
                        <li>In the event that specific product conditions apply in addition to these general terms and conditions, the second and third paragraphs apply mutatis mutandis, and the Consumer may always invoke the applicable provision that is most favorable to him in the event of conflicting conditions.</li>
                    </ul>

                    <h3 id="art4" className="text-2xl font-bold mt-12 mb-4 pb-3 border-b-2 border-gray-800 scroll-mt-32">
                        Article 4 - The Offer
                    </h3>
                    <ul className="list-disc pl-6 mb-8 space-y-2 text-gray-700">
                        <li>If an offer has a limited validity period or is made subject to conditions, this will be explicitly stated in the offer.</li>
                        <li>The offer contains a complete and accurate description of the products offered. The description is sufficiently detailed to enable a proper assessment of the offer by the Consumer. If the Seller (Techbyte.nl) uses images, these are a truthful representation of the products offered. Obvious mistakes or obvious errors in the offer do not bind the Seller (Techbyte.nl).</li>
                        <li>Each offer contains such information that it is clear to the Consumer what rights and obligations are attached to the acceptance of the offer.</li>
                        <li>Techbyte holds the copyright to the written product texts.</li>
                    </ul>

                    <h3 id="art5" className="text-2xl font-bold mt-12 mb-4 pb-3 border-b-2 border-gray-800 scroll-mt-32">
                        Article 5 - The Agreement
                    </h3>
                    <ul className="list-disc pl-6 mb-8 space-y-2 text-gray-700">
                        <li>The agreement is concluded, subject to the provisions of paragraph 4, at the moment of acceptance by the Consumer of the offer and the fulfillment of the conditions set out therein.</li>
                        <li>If the Consumer has accepted the offer electronically, the Seller (Techbyte.nl) will immediately confirm receipt of the acceptance of the offer electronically. As long as the receipt of this acceptance has not been confirmed by the Seller (Techbyte.nl), the Consumer can dissolve the agreement.</li>
                        <li>If the agreement is concluded electronically, the Seller (Techbyte.nl) will take appropriate technical and organizational measures to secure the electronic transfer of data and will ensure a safe web environment. If the Consumer can pay electronically, the Seller (Techbyte.nl) will observe appropriate security measures.</li>
                        <li>The Seller (Techbyte.nl) may—within statutory frameworks—investigate whether the Consumer can meet his payment obligations, as well as investigate all those facts and factors that are important for a responsible conclusion of the distance contract. If the Seller (Techbyte.nl) has good grounds based on this investigation not to enter into the agreement, he is entitled to refuse an order or request, with reasons, or to attach special conditions to the execution.</li>
                        <li>The Seller (Techbyte.nl) will send the following information to the Consumer, at the latest upon delivery of the product, in writing or in such a way that it can be stored by the Consumer in an accessible manner on a durable data carrier: the visiting address of the establishment of the Seller (Techbyte.nl) where the Consumer can go with complaints; the conditions under which and the manner in which the Consumer can make use of the right of withdrawal, or a clear statement regarding the exclusion of the right of withdrawal; information about guarantees and existing after-sales service; the price including all taxes of the product; insofar as applicable, the costs of delivery; and the method of payment, delivery, or execution of the distance contract; if the Consumer has a right of withdrawal, the model form for withdrawal.</li>
                    </ul>

                    <h3 id="art6" className="text-2xl font-bold mt-12 mb-4 pb-3 border-b-2 border-gray-800 scroll-mt-32">
                        Article 6 – Reflection Period (Right of Withdrawal)
                    </h3>
                    <p className="mb-4 font-semibold text-gray-800">For products:</p>
                    <ul className="list-disc pl-6 mb-8 space-y-2 text-gray-700">
                        <li>The Consumer can dissolve an agreement regarding the purchase of a product during a reflection period of 14 days without giving reasons. The Seller (Techbyte.nl) may ask the Consumer for the reason for withdrawal, but cannot oblige him to state his reason(s).</li>
                        <li>The reflection period referred to in paragraph 1 commences on the day after the Consumer, or a third party designated in advance by the Consumer, who is not the carrier, has received the product, or: if the Consumer has ordered several products in the same order: the day on which the Consumer, or a third party designated by him, received the last product. The Seller (Techbyte.nl) may refuse an order of several products with different delivery times, provided he has clearly informed the Consumer of this prior to the ordering process; if the delivery of a product consists of different shipments or parts: the day on which the Consumer, or a third party designated by him, received the last shipment or the last part; in the case of agreements for the regular delivery of products during a certain period: the day on which the Consumer, or a third party designated by him, received the first product.</li>
                    </ul>

                    <h3 id="art7" className="text-2xl font-bold mt-12 mb-4 pb-3 border-b-2 border-gray-800 scroll-mt-32">
                        Article 7 - Obligations of the Seller (Techbyte.nl) regarding returns
                    </h3>
                    <ul className="list-disc pl-6 mb-8 space-y-2 text-gray-700">
                        <li>If the Seller (Techbyte.nl) makes the notification of withdrawal by the Consumer possible electronically, he will immediately send a confirmation of receipt after receiving this notification.</li>
                        <li>The Seller (Techbyte.nl) will reimburse all payments made by the Consumer, including any delivery costs charged by the Seller (Techbyte.nl) for the returned product, immediately but within 14 days following the day on which the Consumer notifies him of the withdrawal. Unless the Seller (Techbyte.nl) offers to collect the product himself, he may wait with repayment until he has received the product or until the Consumer demonstrates that he has returned the product, whichever is earlier.</li>
                        <li>The Seller (Techbyte.nl) uses the same payment method for reimbursement that the Consumer used, unless the Consumer agrees to another method. The reimbursement is free of charge for the Consumer.</li>
                        <li>If the Consumer has opted for a more expensive method of delivery than the cheapest standard delivery, the Seller (Techbyte.nl) does not have to reimburse the additional costs for the more expensive method.</li>
                    </ul>

                    <h3 id="art8" className="text-2xl font-bold mt-12 mb-4 pb-3 border-b-2 border-gray-800 scroll-mt-32">
                        Article 8 - The Price
                    </h3>
                    <ul className="list-disc pl-6 mb-8 space-y-2 text-gray-700">
                        <li>During the validity period mentioned in the offer, the prices of the offered products will not be increased, except for price changes resulting from changes in VAT rates.</li>
                        <li>Contrary to the previous paragraph, the Seller (Techbyte.nl) may offer products whose prices are subject to fluctuations in the financial market and over which the Seller (Techbyte.nl) has no influence, with variable prices. This link to fluctuations and the fact that any prices mentioned are target prices will be stated with the offer.</li>
                        <li>The prices mentioned in the offer of products include VAT.</li>
                        <li>All prices are subject to printing and typesetting errors. No liability is accepted for the consequences of printing and typesetting errors. In the event of printing and typesetting errors, the Seller (Techbyte.nl) is not obliged to deliver the product according to the incorrect price. The Consumer's duty to investigate applies here.</li>
                    </ul>

                    <h3 id="art9" className="text-2xl font-bold mt-12 mb-4 pb-3 border-b-2 border-gray-800 scroll-mt-32">
                        Article 9 - Compliance and Warranty
                    </h3>
                    <ul className="list-disc pl-6 mb-8 space-y-2 text-gray-700">
                        <li>The Seller (Techbyte.nl) guarantees that the products comply with the agreement, the specifications stated in the offer, reasonable requirements of soundness and/or usability, and the statutory provisions and/or government regulations existing on the date of the conclusion of the agreement. If agreed, the Seller (Techbyte.nl) also guarantees that the product is suitable for other than normal use.</li>
                        <li>An extra guarantee provided by the Seller (Techbyte.nl), his supplier, manufacturer, or importer never limits the legal rights and claims that the Consumer can enforce against the Seller (Techbyte.nl) under the agreement if the Seller (Techbyte.nl) has failed to fulfill his part of the agreement.</li>
                    </ul>

                    <h3 id="art10" className="text-2xl font-bold mt-12 mb-4 pb-3 border-b-2 border-gray-800 scroll-mt-32">
                        Article 10 - Delivery and Execution
                    </h3>
                    <ul className="list-disc pl-6 mb-8 space-y-2 text-gray-700">
                        <li>The Seller (Techbyte.nl) will exercise the greatest possible care when receiving and executing orders for products.</li>
                        <li>The place of delivery is the address that the Consumer has made known to the Seller (Techbyte.nl).</li>
                        <li>With due observance of what is stated in Article 4 of these general terms and conditions, the Seller (Techbyte.nl) will execute accepted orders expeditiously but at the latest within 30 days, unless another delivery period has been agreed. If delivery is delayed, or if an order cannot be executed or can only be partially executed, the Consumer will be notified of this no later than 30 days after he has placed the order. In that case, the Consumer has the right to dissolve the agreement without costs.</li>
                        <li>After dissolution in accordance with the previous paragraph, the Seller (Techbyte.nl) will immediately refund the amount that the Consumer has paid.</li>
                        <li>The risk of damage and/or loss of products rests with the Seller (Techbyte.nl) until the moment of delivery to the Consumer or a representative designated in advance and made known to the Seller (Techbyte.nl), unless explicitly agreed otherwise.</li>
                    </ul>

                    <h3 id="art11" className="text-2xl font-bold mt-12 mb-4 pb-3 border-b-2 border-gray-800 scroll-mt-32">
                        Article 11 - Payment
                    </h3>
                    <ul className="list-disc pl-6 mb-8 space-y-2 text-gray-700">
                        <li>Unless otherwise provided in the agreement or additional conditions, the amounts owed by the Consumer must be paid within 14 days after the start of the reflection period, or in the absence of a reflection period, within 14 days after the conclusion of the agreement.</li>
                        <li>When selling products to Consumers, the Consumer may never be obliged in general terms and conditions to make an advance payment of more than 50%. When advance payment is stipulated, the Consumer cannot assert any rights regarding the execution of the relevant order before the stipulated advance payment has been made.</li>
                        <li>The Consumer has the duty to immediately report inaccuracies in payment data provided or stated to the Seller (Techbyte.nl).</li>
                        <li>If the Consumer does not meet his payment obligation(s) in time, he is—after having been informed by the Seller (Techbyte.nl) of the late payment and the Seller (Techbyte.nl) has granted the Consumer a period of 14 days to still meet his payment obligations, and payment is not made within this 14-day period—liable for statutory interest on the amount still owed, and the Seller (Techbyte.nl) is entitled to charge the extrajudicial collection costs incurred by him.</li>
                    </ul>

                    <h3 id="art12" className="text-2xl font-bold mt-12 mb-4 pb-3 border-b-2 border-gray-800 scroll-mt-32">
                        Article 12 – Applicable Law and Competent Court
                    </h3>
                    <ul className="list-disc pl-6 mb-8 space-y-2 text-gray-700">
                        <li>Agreements between the Seller (Techbyte.nl) and the Consumer to which these general terms and conditions apply are exclusively governed by Dutch law.</li>
                        <li>Disputes between the Consumer and the Seller (Techbyte.nl) regarding the conclusion or execution of agreements with regard to products to be delivered or delivered by this Seller (Techbyte.nl) can, with due observance of the provisions below, be submitted exclusively by both the Consumer and the Seller (Techbyte.nl) to the District Court of North Holland, location Haarlem.</li>
                    </ul>

                    <h3 id="art13" className="text-2xl font-bold mt-12 mb-4 pb-3 border-b-2 border-gray-800 scroll-mt-32">
                        Article 13 - Additional or Deviating Provisions
                    </h3>
                    <p className="mb-8 text-gray-700">
                        Additional provisions or provisions deviating from these general terms and conditions may not be to the detriment of the Consumer
                        and must be recorded in writing or in such a way that they can be stored by the Consumer in an accessible manner on a durable data carrier.
                    </p>

                    <h3 id="art14" className="text-2xl font-bold mt-12 mb-4 pb-3 border-b-2 border-gray-800 scroll-mt-32">
                        Article 14 - Amendment of the General Terms and Conditions
                    </h3>
                    <p className="mb-8 text-gray-700">
                        Changes to these conditions are only effective after they have been published in the appropriate manner, on the understanding that
                        in the event of applicable changes during the term of an offer, the provision most favorable to the Consumer will prevail.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Terms;
