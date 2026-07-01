package enums

type BoxKind string

const (
	BoxKindCourse   BoxKind = "course"
	BoxKindLogical  BoxKind = "logical"
	BoxKindOptional BoxKind = "optional"
)

type LogicalOp string

const (
	LogicalOpAnd LogicalOp = "and"
	LogicalOpOr  LogicalOp = "or"
	LogicalOpXor LogicalOp = "xor"
)
