const fs = require('fs');
let content = fs.readFileSync('src/components/Navbar.tsx', 'utf8');

// Replace the mess I created with the correct closing tags.
const messedUpStart = content.indexOf(`{isOpen ? <X size={24} /> : <Men      {/* Mobile Menu */}`);
if (messedUpStart !== -1) {
    const endStr = `</AnimatePresence>\n    </nav>\n    </>\n  );\n}`;
    const messedUpEnd = content.indexOf(endStr);
    
    // Correct content blocks
    const correctEndingStr = `{isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white shadow-lg overflow-hidden max-h-[85vh] overflow-y-auto"
          >
            <div className="px-4 pt-2 pb-6 space-y-2">
              {isLoggedIn && (
                <div className="pb-4 mb-2 border-b border-gray-100 space-y-2">
                  <div className="flex items-center justify-between px-2 pt-2">
                    <div className="flex items-center gap-3">
                      {user?.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover border border-gray-200" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center font-bold text-lg">
                          {user?.name?.charAt(0) || 'U'}
                        </div>
                      )}
                      <div>
                        <div className="text-sm text-gray-500">Xin chào,</div>
                        <div className="font-bold text-gray-800 leading-tight">{user?.name}</div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          onChangePasswordClick?.();
                          setIsOpen(false);
                        }}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                        title="Đổi mật khẩu"
                      >
                        <User size={20} />
                      </button>
                      <button
                        onClick={() => {
                          onLogout?.();
                          setIsOpen(false);
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        title="Đăng xuất"
                      >
                        <LogOut size={20} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => {
                        onWorkClick?.();
                        setIsOpen(false);
                      }}
                      className="flex-1 py-2 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium text-sm hover:bg-[var(--color-primary)]/20 transition-colors"
                    >
                      Công việc
                    </button>
                    {['admin', 'Quản trị viên', 'manager', 'Quản lý', 'Giám đốc', 'Phó giám đốc', 'Trưởng phòng', 'Kiểm soát viên', 'Biên tập viên', 'manage', 'head_of_department', 'controller', 'editor', 'deputy_director', 'accountant', 'lawyer', 'legal_associate', 'trainee_lawyer', 'legal_intern'].includes(user?.role || '') && (
                      <button
                        onClick={() => {
                          onDashboardClick?.();
                          setIsOpen(false);
                        }}
                        className="flex-1 py-2 rounded-lg bg-[var(--color-primary)] text-white font-medium text-sm hover:bg-[var(--color-primary-light)] transition-colors"
                      >
                        Quản trị
                      </button>
                    )}
                  </div>
                </div>
              )}

              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.to}
                  spy={true}
                  smooth={true}
                  offset={-70}
                  duration={500}
                  activeClass="!text-[var(--color-primary)] bg-gray-50"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-3 text-base font-medium text-gray-700 transition-all duration-300 hover:text-[var(--color-primary)] hover:bg-gray-50 rounded-lg cursor-pointer"
                >
                  {link.name}
                </Link>
              ))}
              {!isLoggedIn && (
                <button
                  onClick={() => {
                    onLoginClick();
                    setIsOpen(false);
                  }}
                  className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)] transition-colors"
                >
                  <User size={18} />
                  <span>Đăng nhập</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
    </>
  );
}`;
    
    // We found where the mess ends. It's either the full file end, or maybe something else. 
    // Let's just find the very end of the file.
    let beforeMess = content.substring(0, messedUpStart);
    fs.writeFileSync('src/components/Navbar.tsx', beforeMess + correctEndingStr);
    console.log("Navbar fixed");
} else {
    console.log("Could not find the messed up string");
}
