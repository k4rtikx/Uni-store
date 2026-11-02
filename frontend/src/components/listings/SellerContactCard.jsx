import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  GraduationCap,
  Mail,
  Phone,
  MessageCircle,
  Copy,
  AlertCircle,
} from 'lucide-react';

/**
 * SellerContactCard Component
 * Stateless component displaying verified seller information and action/contact buttons
 * (WhatsApp direct deal, Email, Copy info, and Sold disabled box).
 */
const SellerContactCard = ({
  sellerName,
  sellerCollege,
  sellerEmail,
  sellerPhone,
  isSold = false,
  isOwner = false,
  whatsAppLink = '',
  emailLink = '',
  copiedContact = false,
  onCopyDetails,
}) => {
  return (
    <>
      {/* Verified Campus Seller Card */}
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Verified Campus Student Seller
          </span>
          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200/60">
            RJIT Student ID Verified
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
            {sellerName ? sellerName.charAt(0).toUpperCase() : 'S'}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-slate-900 text-sm truncate">{sellerName}</h4>
            <p className="text-xs text-slate-500 flex items-center gap-1 truncate">
              <GraduationCap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">{sellerCollege}</span>
            </p>
          </div>
        </div>

        {/* Contact information (Visible only when not sold) */}
        {!isSold && (
          <div className="pt-2 border-t border-slate-200/70 space-y-1.5 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-medium truncate">{sellerEmail}</span>
            </div>

            {sellerPhone && (
              <div className="flex items-center gap-2 text-slate-600">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-medium">{sellerPhone}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action / Contact Buttons Section */}
      <div className="space-y-3 pt-2">
        {isSold ? (
          /* CRITICAL REQUIREMENT: If listing is Sold, completely hide
             WhatsApp and Email contact buttons to prevent further outreach */
          <div
            id="sold-outreach-disabled-box"
            className="p-4 rounded-2xl bg-amber-50 border border-amber-200/90 text-amber-900 space-y-2"
          >
            <div className="flex items-center gap-2 font-bold text-sm">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>Item Sold Out</span>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">
              This item has already been marked as <strong>SOLD</strong>. Direct WhatsApp and
              Email contact buttons are closed to prevent further inquiries.
            </p>
            <button
              type="button"
              disabled
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 font-bold text-xs cursor-not-allowed select-none"
            >
              <MessageCircle className="w-4 h-4 text-slate-400" />
              Outreach Disabled (Item Sold)
            </button>
          </div>
        ) : isOwner ? (
          <div className="space-y-2">
            <Link
              to="/my-listings"
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <span>Manage in My Listings</span>
            </Link>
            <button
              type="button"
              onClick={onCopyDetails}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              {copiedContact ? 'Copied to Clipboard!' : 'Copy Listing Details'}
            </button>
          </div>
        ) : (
          /* If available and not owner: Render Direct WhatsApp Deal and Email Contact */
          <div id="contact-action-buttons" className="space-y-2.5 w-full">
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              {sellerPhone ? (
                <a
                  id="direct-whatsapp-deal-btn"
                  href={whatsAppLink}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/25 transition-all active:scale-95 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Direct WhatsApp Deal</span>
                </a>
              ) : (
                <div className="w-full sm:flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-slate-100 text-slate-400 font-medium text-xs">
                  <Phone className="w-4 h-4" />
                  <span>WhatsApp Not Provided</span>
                </div>
              )}

              <a
                id="email-contact-btn"
                href={emailLink}
                className="w-full sm:flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-slate-900/20 transition-all active:scale-95 cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                <span>Email Seller</span>
              </a>
            </div>

            <button
              type="button"
              onClick={onCopyDetails}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              {copiedContact ? 'Contact Info Copied!' : 'Copy Seller Contact Info'}
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default SellerContactCard;
