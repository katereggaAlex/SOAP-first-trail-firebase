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
            callbackHost: functions.config().momo.webhook
        });

        const collections = Collections({
            userSecret: functions.config().momo.secret,
            userId: functions.config().momo.id,
            primaryKey: functions.config().momo.key
        });

        try {

            const payload = {
                amount: "11.15",
                currency: "EUR",
                externalId: currentUUID,
                payer: {
                    partyIdType: "MSISDN",
                    partyId: formatPhoneNumber(payment.phoneNumber)
                },
                payerMessage: `${payment.name} is paying for a form`,
                payeeNote: `${payment.name} is paying for a form`
            };

            const response = await collections.requestToPay(payload);

            const transaction = await collections.getTransaction(response);

            if (transaction.status === "SUCCESSFUL") {
                const update = {
                    isSuccessful: true,
                    pending: false,
                    financialTransactionId: transaction.financialTransactionId,
                    response: "SUCCESSFUL"
                };

                return await admin.firestore().collection("payments").doc(`${context.params.paymentId}`).update(update);
            } else {
                const update = {
                    isSuccessful: false,
                    pending: false,
                    response: "FAILED"
                };

                return await admin.firestore().collection("payments").doc(`${context.params.paymentId}`).update(update);
            }

        } catch (error) {
            console.log(error);
        }

    }

});