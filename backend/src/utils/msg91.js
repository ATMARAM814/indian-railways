const otpStore = new Map();
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const OTP_COOLDOWN_MS = 30 * 1000; // 30 seconds
const MAX_ATTEMPTS = 5;

async function sendOTP(mobileNumber) {
  const formattedNumber = `91${mobileNumber}`;
  
  const existingRecord = otpStore.get(formattedNumber);
  if (existingRecord) {
    const timeSinceLastSent = Date.now() - existingRecord.sentAt;
    if (timeSinceLastSent < OTP_COOLDOWN_MS) {
      throw new Error(`Please wait ${Math.ceil((OTP_COOLDOWN_MS - timeSinceLastSent) / 1000)} seconds before requesting a new OTP`);
    }
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  otpStore.set(formattedNumber, {
    otp,
    expiresAt: Date.now() + OTP_EXPIRY_MS,
    sentAt: Date.now(),
    attempts: 0,
  });

  console.log(`\n=========================================`);
  console.log(`[MSG91 MOCK] SMS Sent Successfully!`);
  console.log(`[MSG91 MOCK] To Number: ${formattedNumber}`);
  console.log(`[MSG91 MOCK] OTP Code:  ${otp}`);
  console.log(`=========================================\n`);

  return {
    success: true,
    message: "OTP sent successfully via mock MSG91",
  };
}

async function verifyOTP(mobileNumber, submittedOtp) {
  const formattedNumber = `91${mobileNumber}`;
  const record = otpStore.get(formattedNumber);

  if (!record) {
    throw new Error("No OTP requested or OTP expired");
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(formattedNumber);
    throw new Error("OTP has expired");
  }

  if (record.otp !== submittedOtp.toString()) {
    record.attempts += 1;
    
    if (record.attempts >= MAX_ATTEMPTS) {
      otpStore.delete(formattedNumber);
      throw new Error("Too many failed attempts. Request a new OTP.");
    }
    
    throw new Error(`Invalid OTP. You have ${MAX_ATTEMPTS - record.attempts} attempts left.`);
  }

  otpStore.delete(formattedNumber);

  return {
    success: true,
    message: "OTP verified successfully",
  };
}

module.exports = {
  sendOTP,
  verifyOTP,
};
