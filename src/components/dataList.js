(() => ({
  name: 'DataList',
  type: 'CONTAINER_COMPONENT',
  allowedTypes: ['BODY_COMPONENT', 'CONTAINER_COMPONENT', 'CONTENT_COMPONENT'],
  orientation: 'HORIZONTAL',
  jsx: (
    <div className={classes.root}>
      {(() => {
        const {
          env,
          getProperty,
          GetMe,
          InteractionScope,
          ModelProvider,
          useAllQuery,
          useFilter,
        } = B;
        const [page, setPage] = useState(1);
        const [search, setSearch] = useState('');
        const [searchTerm, setSearchTerm] = useState('');
        const [isTyping, setIsTyping] = useState(false);
        const {
          take,
          filter,
          type,
          model,
          authProfile,
          showError,
          hideSearch,
          searchProperty,
          order,
          orderBy,
          pagination,
          numberedList,
          numberType,
        } = options;

        const rowsPerPage = parseInt(take, 10) || 50;
        const { TextField, InputAdornment } = window.MaterialUI.Core;
        const { Search } = window.MaterialUI.Icons;
        const { label: searchPropertyLabel } =
          getProperty(searchProperty) || {};

        const isEmpty = children.length === 0;
        const isDev = env === 'dev';
        const isPristine = isEmpty && isDev;
        const displayError = showError === 'built-in';
        const listRef = React.createRef();
        const [showPagination, setShowPagination] = useState(true);
        const isInline = type === 'inline';
        const isGrid = type === 'grid';

        const NumberTag = {
          Title1: 'h1',
          Title2: 'h2',
          Title3: 'h3',
          Title4: 'h4',
          Title5: 'h5',
          Title6: 'h6',
          Body1: 'p',
          Body2: 'p',
        }[numberType || 'Body1'];

        const builderLayout = () => (
          <>
            {searchProperty && !hideSearch && (
              <div className={classes.header}>
                <SearchComponent label={searchPropertyLabel} />
              </div>
            )}
            <div ref={listRef} className={isGrid && classes.grid}>
              <div
                className={
                  [
                    isEmpty ? classes.empty : '',
                    isPristine ? classes.pristine : '',
                    isInline ? classes.inline : '',
                    numberedList ? classes.itemNumberWrapper : '',
                  ]
                    .filter(Boolean)
                    .join(' ') || undefined
                }
              >
                {isPristine &&
                  'Drag a component in the data list to display the data'}
                {!isPristine && numberedList ? (
                  <>
                    <NumberTag className={classes.itemNumber}>
                      {`1. `}
                    </NumberTag>
                    {children}
                  </>
                ) : (
                  children
                )}
              </div>
            </div>

            {isDev && showPagination && (
              <div className={classes.footer}>
                <Pagination
                  totalCount={0}
                  resultCount={rowsPerPage}
                  currentPage={1}
                />
              </div>
            )}
          </>
        );

        useEffect(() => {
          if (!isDev) return;
          const repeat = () => {
            if (!listRef.current) return;
            const numberOfChildren = listRef.current.children.length;
            if (numberOfChildren === 0) {
              return;
            }
            for (let i = numberOfChildren - 1, j = 0; i > j; i -= 1) {
              const child = listRef.current.children[i];
              if (child) {
                listRef.current.removeChild(child);
              }
            }
            for (let i = 0, j = rowsPerPage - 1; i < j; i += 1) {
              listRef.current.children[0].insertAdjacentHTML(
                'afterend',
                listRef.current.children[0].outerHTML,
              );
            }
            listRef.current.children.forEach((child, index) => {
              if (index > 0) {
                const elem = child;
                if (numberedList)
                  elem.childNodes[0].innerText = `${index + 1}.\u00A0`;
                elem.style.opacity = 0.4;
                elem.style.pointerEvents = 'none';
              }
            });
          };
          const mutationObserver = new MutationObserver(() => {
            repeat();
          });
          mutationObserver.observe(listRef.current.children[0], {
            attributes: true,
            characterData: true,
            childList: true,
            subtree: true,
            attributeOldValue: false,
            characterDataOldValue: false,
          });
          repeat();
        });

        const handleSearch = event => {
          setSearch(event.target.value);
        };

        const deepMerge = (...objects) => {
          const isObject = item =>
            item && typeof item === 'object' && !Array.isArray(item);

          return objects.reduce((accumulator, object) => {
            Object.keys(object).forEach(key => {
              const accumulatorValue = accumulator[key];
              const value = object[key];

              if (Array.isArray(accumulatorValue) && Array.isArray(value)) {
                accumulator[key] = accumulatorValue.concat(value);
              } else if (isObject(accumulatorValue) && isObject(value)) {
                accumulator[key] = deepMerge(accumulatorValue, value);
              } else {
                accumulator[key] = value;
              }
            });
            return accumulator;
          }, {});
        };

        const orderByPath = Array.isArray(orderBy.id) ? orderBy.id : null;
        const sort =
          !isDev && orderByPath
            ? orderByPath.reduceRight((acc, property, index) => {
                const prop = getProperty(property);
                return index === orderByPath.length - 1
                  ? { [prop.name]: order.toUpperCase() }
                  : { [prop.name]: acc };
              }, {})
            : {};

        let path = [searchProperty].flat();
        if (typeof searchProperty.id !== 'undefined') {
          path = [searchProperty.id].flat();
        }

        const searchFilter = searchProperty
          ? path.reduceRight(
              (acc, property, index) =>
                index === path.length - 1
                  ? { [property]: { matches: searchTerm } }
                  : { [property]: acc },
              {},
            )
          : {};

        const newFilter =
          searchProperty && searchTerm !== ''
            ? deepMerge(filter, searchFilter)
            : filter;

        const where = useFilter(newFilter);

        const { loading, error, data, refetch } =
          model &&
          useAllQuery(model, {
            rawFilter: where,
            skip: page ? (page - 1) * rowsPerPage : 0,
            take: rowsPerPage,
            variables: {
              ...(orderByPath ? { sort: { relation: sort } } : {}),
            },
            onCompleted(res) {
              const hasResult = res && res.results && res.results.length > 0;
              if (hasResult) {
                B.triggerEvent('onSuccess', res.results);
              } else {
                B.triggerEvent('onNoResults');
              }
            },
            onError(resp) {
              if (!displayError) {
                B.triggerEvent('onError', resp);
              }
            },
          });

        useEffect(() => {
          if (isDev) {
            if (pagination === 'never') {
              setShowPagination(false);
            } else {
              setShowPagination(true);
            }
          }
        }, [pagination]);

        useEffect(() => {
          if (!isDev && data) {
            switch (pagination) {
              case 'never':
                setShowPagination(false);
                break;
              case 'whenNeeded':
                if (rowsPerPage >= data.totalCount) {
                  setShowPagination(false);
                }
                break;
              default:
              case 'always':
                setShowPagination(true);
            }
          }
        }, [data, rowsPerPage]);

        useEffect(() => {
          const handler = setTimeout(() => {
            setSearchTerm(search);
          }, 300);

          return () => {
            clearTimeout(handler);
          };
        }, [search]);

        B.defineFunction('Refetch', () => refetch());
        B.defineFunction('SetSearchValue', event => {
          setSearch(event.target.value);
        });

        const mounted = useRef(false);

        useEffect(() => {
          mounted.current = true;
          return () => {
            mounted.current = false;
          };
        }, []);

        useEffect(() => {
          if (mounted.current && loading) {
            B.triggerEvent('onLoad', loading);
          }
        }, [loading]);

        const handleClick = (event, context) => {
          B.triggerEvent('OnItemClick', event, context);
        };

        const Looper = results => {
          const rows = results.map((item, index) => {
            const itemNumber = `${index + 1 + rowsPerPage * (page - 1)}.\u00A0`;

            return (
              <ModelProvider key={item.id} value={item} id={model}>
                <InteractionScope model={model}>
                  {context => (
                    <div
                      role="none"
                      className={isInline && classes.inline}
                      onClick={event => handleClick(event, context)}
                    >
                      {numberedList ? (
                        <span className={classes.itemNumberWrapper}>
                          <NumberTag className={classes.itemNumber}>
                            {itemNumber}
                          </NumberTag>
                          {children}
                        </span>
                      ) : (
                        children
                      )}
                    </div>
                  )}
                </InteractionScope>
              </ModelProvider>
            );
          });

          if (authProfile) {
            return <GetMe authenticationProfileId={authProfile}>{rows}</GetMe>;
          }

          return rows;
        };

        const canvasLayout = () => {
          if (!model) {
            return builderLayout();
          }

          if (loading) return <div className={classes.skeleton} />;

          if (error && displayError) {
            return <span>{error.message}</span>;
          }

          const { results = [], totalCount } = data || {};
          const resultCount = results && results.length;

          return (
            <>
              {searchProperty && !hideSearch && (
                <div className={classes.header}>
                  <SearchComponent
                    label={searchPropertyLabel}
                    onChange={handleSearch}
                    value={search}
                    isTyping={isTyping}
                    setIsTyping={setIsTyping}
                  />
                </div>
              )}

              {!isGrid ? (
                Looper(results)
              ) : (
                <div className={classes.grid}>{Looper(results)}</div>
              )}

              {showPagination && (
                <div className={classes.footer}>
                  <Pagination
                    totalCount={totalCount}
                    resultCount={resultCount}
                    currentPage={page}
                  />
                </div>
              )}
            </>
          );
        };

        /* SubComponents */

        function SearchComponent({
          label,
          onChange,
          value,
          // eslint-disable-next-line no-shadow
          isTyping,
          // eslint-disable-next-line no-shadow
          setIsTyping,
        }) {
          const inputRef = React.createRef();

          useEffect(() => {
            if (isTyping) {
              inputRef.current.focus();
            }
          });

          return (
            <div className={classes.searchWrapper}>
              <TextField
                placeholder={`Search on ${label}`}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
                onChange={onChange}
                inputRef={inputRef}
                onFocus={() => setIsTyping(true)}
                onBlur={() => setIsTyping(false)}
                value={value}
              />
            </div>
          );
        }

        function Pagination({ totalCount, resultCount, currentPage }) {
          const firstItem = currentPage ? (currentPage - 1) * rowsPerPage : 0;

          useEffect(() => {
            const totalPages = Math.ceil(totalCount / rowsPerPage);

            if (currentPage > totalPages) {
              setPage(totalPages);
            }
          }, [totalCount]);

          const totalText = env === 'dev' ? '[total]' : totalCount;

          return (
            <>
              <span>
                {firstItem + 1}
                {firstItem + 1 !== totalCount &&
                  ` - ${firstItem + resultCount}`}{' '}
                of {totalText}
              </span>
              <div className={classes.pagination}>
                {typeof currentPage !== 'undefined' && currentPage > 1 ? (
                  <button
                    className={classes.button}
                    type="button"
                    onClick={() => setPage(v => v - 1)}
                  >
                    <span
                      className={[classes.arrow, 'zmdi zmdi-chevron-left'].join(
                        ' ',
                      )}
                    />
                  </button>
                ) : (
                  <span
                    className={[
                      classes.arrow,
                      classes.arrowDisabled,
                      'zmdi zmdi-chevron-left',
                    ].join(' ')}
                  />
                )}
                {(typeof currentPage === 'undefined' ? 1 : currentPage) <
                totalCount / rowsPerPage ? (
                  <button
                    className={classes.button}
                    type="button"
                    onClick={() => setPage(v => v + 1)}
                  >
                    <span
                      className={[
                        classes.arrow,
                        'zmdi zmdi-chevron-right',
                      ].join(' ')}
                    />
                  </button>
                ) : (
                  <span
                    className={[
                      classes.arrow,
                      classes.arrowDisabled,
                      'zmdi zmdi-chevron-right',
                    ].join(' ')}
                  />
                )}
              </div>
            </>
          );
        }

        return isDev ? builderLayout() : canvasLayout();
      })()}
    </div>
  ),
  styles: B => theme => {
    const { mediaMinWidth, Styling } = B;
    const style = new Styling(theme);
    const getSpacing = (idx, device = 'Mobile') =>
      idx === '0' ? '0rem' : style.getSpacing(idx, device);
    const getPath = (path, data) =>
      path.reduce((acc, next) => {
        if (acc === undefined || acc[next] === undefined) {
          return undefined;
        }
        return acc[next];
      }, data);

    return {
      root: {
        marginTop: ({ options: { outerSpacing } }) =>
          getSpacing(outerSpacing[0]),
        marginRight: ({ options: { outerSpacing } }) =>
          getSpacing(outerSpacing[1]),
        marginBottom: ({ options: { outerSpacing } }) =>
          getSpacing(outerSpacing[2]),
        marginLeft: ({ options: { outerSpacing } }) =>
          getSpacing(outerSpacing[3]),
      },
      inline: {
        display: 'inline-flex',
      },
      header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexDirection: 'row-reverse',
        width: '100%',
      },
      searchWrapper: {
        display: 'flex',
        alignItems: 'center',
        padding: [0, '0.5rem'],
        minHeight: '4rem',
      },
      searchIcon: {
        fontSize: '1.25rem',
        marginRight: '1rem',
      },
      search: {
        padding: ['0.25rem', 0],
        fontSize: '1rem',
        border: 'none',
        outline: 'none',
      },
      itemNumberWrapper: {
        display: 'flex',
        justifyContent: 'left',
        flexDirection: 'row',
        alignItems: 'center',
      },
      itemNumber: {
        margin: 0,
        color: ({ options: { textColor, numberType, styles } }) =>
          styles
            ? style.getColor(textColor)
            : getPath(['theme', 'typography', numberType, 'color'], style),
        fontFamily: ({ options: { numberType } }) =>
          style.getFontFamily(numberType),
        fontSize: ({ options: { numberType } }) =>
          style.getFontSize(numberType),
        fontWeight: ({ options: { fontWeight, numberType, styles } }) =>
          styles
            ? fontWeight
            : getPath(['theme', 'typography', numberType, 'fontWeight'], style),
        textTransform: ({ options: { numberType } }) =>
          style.getTextTransform(numberType),
        letterSpacing: ({ options: { numberType } }) =>
          style.getLetterSpacing(numberType),
        [`@media ${mediaMinWidth(600)}`]: {
          fontSize: ({ options: { numberType } }) =>
            style.getFontSize(numberType, 'Portrait'),
        },
        [`@media ${mediaMinWidth(960)}`]: {
          fontSize: ({ options: { numberType } }) =>
            style.getFontSize(numberType, 'Landscape'),
        },
        [`@media ${mediaMinWidth(1280)}`]: {
          fontSize: ({ options: { numberType } }) =>
            style.getFontSize(numberType, 'Desktop'),
        },
      },
      button: {
        background: 'transparent',
        border: 'none',
        display: 'inline-block',
        padding: 0,
        margin: 0,
        cursor: 'pointer',
        '&:active': {
          outline: 'none',
        },
      },
      footer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: ['0.75rem', 0],
      },
      placeholder: {
        opacity: '0.4',
      },
      pagination: {
        marginLeft: '1rem',
      },
      arrow: {
        padding: '1rem',
        fontSize: '1.625rem',
        color: '#000',
        textDecoration: 'none',
      },
      arrowDisabled: { color: '#ccc' },
      skeleton: {
        height: `calc(${style.getFont('Body1').Mobile} * 1.2)`,
        [`@media ${mediaMinWidth(600)}`]: {
          height: `calc(${style.getFont('Body1').Portrait} * 1.2)`,
        },
        [`@media ${mediaMinWidth(960)}`]: {
          height: `calc(${style.getFont('Body1').Landscape} * 1.2)`,
        },
        [`@media ${mediaMinWidth(1280)}`]: {
          height: `calc(${style.getFont('Body1').Desktop} * 1.2)`,
        },
        backgroundColor: '#eee',
        borderRadius: 8,
        overflow: 'hidden',
        '&::after': {
          display: 'block',
          width: '100%',
          height: '100%',
          backgroundImage:
            'linear-gradient(90deg, #eee 25%, #fff 50%, #eee 75%)',
          backgroundSize: '200% 100%',
          backgroundRepeat: 'no-repeat',
          backgroundPositionX: '150%',
          borderRadius: `calc(${style.getFont('Body2').Landscape} / 2)`,
          content: '""',
          animation: 'loading 1.5s infinite',
        },
      },
      [`@media ${mediaMinWidth(600)}`]: {
        root: {
          marginTop: ({ options: { outerSpacing } }) =>
            getSpacing(outerSpacing[0], 'Portrait'),
          marginRight: ({ options: { outerSpacing } }) =>
            getSpacing(outerSpacing[1], 'Portrait'),
          marginBottom: ({ options: { outerSpacing } }) =>
            getSpacing(outerSpacing[2], 'Portrait'),
          marginLeft: ({ options: { outerSpacing } }) =>
            getSpacing(outerSpacing[3], 'Portrait'),
        },
      },
      [`@media ${mediaMinWidth(960)}`]: {
        root: {
          marginTop: ({ options: { outerSpacing } }) =>
            getSpacing(outerSpacing[0], 'Landscape'),
          marginRight: ({ options: { outerSpacing } }) =>
            getSpacing(outerSpacing[1], 'Landscape'),
          marginBottom: ({ options: { outerSpacing } }) =>
            getSpacing(outerSpacing[2], 'Landscape'),
          marginLeft: ({ options: { outerSpacing } }) =>
            getSpacing(outerSpacing[3], 'Landscape'),
        },
      },
      [`@media ${mediaMinWidth(1280)}`]: {
        root: {
          marginTop: ({ options: { outerSpacing } }) =>
            getSpacing(outerSpacing[0], 'Desktop'),
          marginRight: ({ options: { outerSpacing } }) =>
            getSpacing(outerSpacing[1], 'Desktop'),
          marginBottom: ({ options: { outerSpacing } }) =>
            getSpacing(outerSpacing[2], 'Desktop'),
          marginLeft: ({ options: { outerSpacing } }) =>
            getSpacing(outerSpacing[3], 'Desktop'),
        },
      },
      grid: {
        display: 'grid',
        gridTemplateColumns: ({ options: { width } }) =>
          `repeat(auto-fit, minmax(${width}, 1fr))`,
        gridGap: ({ options: { gap } }) => `${gap}`,
      },
      empty: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '4rem',
        height: '100%',
        width: '100%',
        fontSize: '0.75rem',
        color: '#262A3A',
        textTransform: 'uppercase',
        boxSizing: 'border-box',
      },
      pristine: {
        borderWidth: '0.0625rem',
        borderColor: '#AFB5C8',
        borderStyle: 'dashed',
        backgroundColor: '#F0F1F5',
      },
    };
  },
}))();
