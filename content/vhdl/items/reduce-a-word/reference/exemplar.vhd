library ieee;
use ieee.std_logic_1164.all;

entity top_module is
    port (
        status : in std_logic_vector(7 downto 0);
        any_set : out std_logic;
        all_set : out std_logic;
        odd_parity : out std_logic;
        logical_present : out std_logic
    );
end entity;

architecture rtl of top_module is
begin
    any_set <= or status;
    all_set <= and status;
    odd_parity <= xor status;
    logical_present <= '1' when status /= x"00" else '0';
end architecture;
