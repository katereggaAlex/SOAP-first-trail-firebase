const functions = require("firebase-functions");
const admin = require("firebase-admin");
const momo = require("mtn-momo");
const { v4: uuid } = require("uuid");

admin.initializeApp();

const formatPhoneNumber = (phonenumber) => {
    return phonenumber.replace("0", "256");
}


exports.makePayment = functions.firestore.document("/payments/{paymentId}").onCreate(async (snap, context) => {
    const payment = snap.data();

    if (payment.pending) {

        const currentUUID = uuid();

        const { Collections } = momo.create({
            callbackHost: "https://www.example.com/"
        });

        const collections = Collections({
            userSecret: functions.config().secret,
            userId: functions.config().id,
            primaryKey: functions.config().key
        });

        try {

            const payload = {
                amount: "50000",
                currency: "UGX",
                externalId: currentUUID,
                payer: {
                    partyIdType: "MSISDN",
                    partyId: formatPhoneNumber(payment.phoneNumber)
                },
                payerMessage: `${payment.name} is paying for a form`,
                payeeNote: `${payment.name} is paying for a form`
            };

            const response = await collections.requestToPay(payload);


            console.log(response.transaction);
        } catch (error) {
            console.log(error);
        }

    }

});