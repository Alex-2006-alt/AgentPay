from decimal import Decimal, InvalidOperation

SCALE = Decimal(1_000_000)


def units(value) -> int:
    """USDC has six decimals. Reject rounding, NaN and unsupported magnitudes."""
    try:
        amount = Decimal(str(value)) * SCALE
        if not amount.is_finite() or amount < 0 or amount != amount.to_integral_value() or amount > 2**63 - 1:
            raise ValueError("Amount must be nonnegative USDC with at most six decimals")
        return int(amount)
    except (InvalidOperation, TypeError) as exc:
        raise ValueError("Invalid USDC amount") from exc


def dollars(value: int) -> float:
    return float(Decimal(value) / SCALE)
