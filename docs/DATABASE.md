# データ設計

## Users
deviceId / userId / name / dept / nick / declaration / weeklyGoal / createdAt / updatedAt

## Activities
deviceId / date / steps / challenge / comment / createdAt

## Point Transactions
transactionId / employeeId / amount / type / sourceId / description / createdAt / createdBy / rewardId / metadataJson / version

残高は `amount` の合計、累計獲得は正の `amount` の合計として算出する。
