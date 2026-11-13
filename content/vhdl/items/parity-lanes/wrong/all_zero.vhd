library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity top_module is
    generic (
        LANES : positive := 4
    );
    port (
        data : in std_logic_vector(LANES*8-1 downto 0);
        received_parity : in std_logic_vector(LANES-1 downto 0);
        error : out std_logic_vector(LANES-1 downto 0)
    );
end entity;

architecture rtl of top_module is
begin
    -- TODO: implement the required behavior.
    error <= (others => '0');
end architecture;
