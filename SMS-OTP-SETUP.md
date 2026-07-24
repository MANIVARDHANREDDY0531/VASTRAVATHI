# Vastravathi SMS OTP Setup

## Railway variables

Add these in Railway > VASTRAVATHI > Variables:

```text
CUSTOMER_OTP_DELIVERY=sms
FAST2SMS_API_KEY=your_fast2sms_api_key
FAST2SMS_ROUTE=otp
FAST2SMS_TEMPLATE_ID=your_fast2sms_template_id_if_required
```

## Important

- Keep `CUSTOMER_OTP_DELIVERY=display` while testing without SMS.
- Change it to `sms` only after Fast2SMS is active and the API key is added.
- `FAST2SMS_TEMPLATE_ID` can be left empty if your Fast2SMS OTP route does not require a template ID.
- OTP is valid for 5 minutes.

## Test

1. Upload the updated files to GitHub.
2. Let Railway redeploy.
3. Add the Railway variables above.
4. Open the website.
5. Click Login or Sign up.
6. Enter a mobile number.
7. The OTP should arrive by SMS.
