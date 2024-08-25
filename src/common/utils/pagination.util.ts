interface PaginationProps {
  page?: number;
  limit?: number;
}

export const pagination = (data: PaginationProps) => {
  const limit = data.limit ? data.limit : 10;

  const page = data.page ? data.page : 1;

  const skip = limit * (page - 1);

  return { limit, skip, page };
};

interface PageDocProps {
  page: number;
  limit: number;
  count: number;
}

export const getPageDocs = (data: PageDocProps) => {
  const page = Math.ceil(data.count / data.limit);

  return {
    total: {
      page,
      limit: data.count,
    },
    next: {
      page: data.page + 1 > page ? null : data.page + 1,
      limit: data.limit ? data.limit : data.count,
    },
    prev: {
      page: data.page ? (data.page - 1 <= 0 ? null : data.page - 1) : null,
      limit: data.limit ? data.limit : data.count,
    },
  };
};
